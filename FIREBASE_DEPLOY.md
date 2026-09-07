# Deploying to Firebase

Architecture: **staff-panel** (React/Vite) is served as static files by **Firebase
Hosting**. **api-server** (Express) runs as a **Cloud Function** (2nd gen), reached
via a Hosting rewrite on `/api/**` so both live on the same domain (same-origin —
cookies/sessions just work, no CORS headaches). The database is **Neon Postgres**
(external, serverless-friendly — no VPC connector needed).

The Discord bot is **not** deployable to Firebase (it needs a persistent websocket
connection to Discord's gateway, which Cloud Functions can't provide). Keep running
it wherever it runs today (Replit, a VPS, Cloud Run with `minInstances: 1`, etc.) —
it just needs the same `DATABASE_URL`.

## 0. One-time tool setup

```bash
npm install -g firebase-tools
firebase login
```

Create a project at https://console.firebase.google.com (or `firebase projects:create`),
then set it in `.firebaserc`:

```bash
firebase use --add
```
Pick your project, alias it `default` — this overwrites the placeholder in `.firebaserc`.

**Cloud Functions require the Blaze (pay-as-you-go) plan** — the free Spark plan
can't run functions. Blaze still has a generous free tier (2M invocations/month);
you won't be charged unless you exceed it.

## 1. Set your secrets

You already have a Neon connection string. Set it and the others:

```bash
firebase functions:secrets:set DATABASE_URL
# paste your Neon connection string when prompted, e.g.:
# postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require

firebase functions:secrets:set SESSION_SECRET
# paste any long random string — generate one with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

firebase functions:secrets:set ROBLOX_GROUP_ID
# your Roblox group ID (numeric)

firebase functions:secrets:set ROBLOX_COOKIE
# your Roblox .ROBLOSECURITY cookie, if used for group-role lookups
```

## 2. Push the database schema to Neon

From the repo root, with `DATABASE_URL` pointed at Neon in your shell:

```bash
export DATABASE_URL="postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require"
cd lib/db
pnpm install
pnpm run push
```

This creates all the app's tables (users, moderation logs, access_change_requests,
etc.) on Neon. The `session` table is created automatically on first request
(connect-pg-simple is configured with `createTableIfMissing: true`).

## 3. Build the frontend

```bash
cd artifacts/staff-panel
PORT=3000 BASE_PATH=/ pnpm install && PORT=3000 BASE_PATH=/ pnpm run build
```

(`PORT` and `BASE_PATH` are only required by `vite.config.ts` at config-load time —
`PORT` isn't actually used for a static build, but the config throws without it.)

This outputs to `artifacts/staff-panel/dist/public`, which `firebase.json` already
points Hosting at.

## 4. Install the Cloud Function's own dependencies

```bash
cd functions
npm install
```
(`functions/` intentionally has its own `package.json` — Firebase deploys it as a
self-contained unit, separate from the pnpm workspace. Everything from the
workspace, including `@workspace/db` and api-server's routes, gets bundled into
one file by esbuild at build time, so this `npm install` only needs to fetch the
few things that stay external: `bcrypt` and `firebase-functions`.)

## 5. Deploy

From the repo root:

```bash
firebase deploy --only hosting,functions
```

This will:
- run `functions`' `predeploy` hook (`npm run build`, i.e. the esbuild bundle)
- upload the Cloud Function
- upload the built frontend to Hosting
- wire up the `/api/**` rewrite to the function

Your site will be live at `https://YOUR-PROJECT-ID.web.app`.

## Redeploying later

```bash
# after backend changes:
cd artifacts/staff-panel && PORT=3000 BASE_PATH=/ pnpm run build && cd ../..
firebase deploy --only hosting,functions
```

## Notes / things that changed for this deployment

- Rank sync (the background job that used to pull ranks from the Roblox group
  automatically) has been fully removed — `clearance` and `rank` are now only
  ever changed manually via the Developer Portal (with the Network
  Engineer/Administrator approval workflow), never overwritten on login.
- `app.ts` now sets `trust proxy` so secure cookies and HTTPS detection work
  correctly behind Firebase's proxy.
- If you ever add more secrets/env vars that `api-server` reads from
  `process.env`, add them to both the `defineSecret(...)` calls in
  `functions/src/index.ts` and the `secrets: [...]` array in the same file,
  then `firebase functions:secrets:set THE_NAME`.
