# Granting Yourself Access + Redeploying — Full Guide

## Part 1: Grant yourself Network Engineer clearance

This part takes effect immediately and does NOT require a redeploy.

1. Go to **neon.tech** and log in.
2. Open your project.
3. Click **"SQL Editor"** in the left sidebar.
4. Run this query to find your user row:
   ```sql
   SELECT id, roblox_username, clearance, rank FROM users;
   ```
5. Find your row in the results and note your exact `roblox_username` spelling
   (case matters).
6. Run this, replacing `YOUR_ROBLOX_USERNAME` with what you found above:
   ```sql
   UPDATE users SET clearance = 'Network Engineer' WHERE roblox_username = 'YOUR_ROBLOX_USERNAME';
   ```
7. Log out and back into the site (or just refresh) to pick up the new
   clearance.

**Important:** the moment this `UPDATE` runs, the "bootstrap" window closes
permanently for everyone else. From now on, you grant clearance to anyone
else through the Developer Portal UI, not by editing the database directly.

---

## Part 2: Copy in the latest code changes

Take the most recent zip I gave you and copy these files into your existing
project folder (the one connected to git — NOT a fresh unzip), overwriting
the old versions:

- `artifacts/staff-panel/src/index.css`
- `artifacts/staff-panel/index.html`
- `artifacts/api-server/src/lib/storage.ts`
- `artifacts/api-server/src/routes/staff-panel.ts`
- `artifacts/staff-panel/src/pages/developer-portal.tsx`

---

## Part 3: Push to GitHub (Railway auto-redeploys the backend)

In your terminal, from the project root:

```
git add .
```
```
git commit -m "New theme, clearance bootstrap fix"
```
```
git push
```

Go to your Railway dashboard, click into your service, open the
**Deployments** tab, and wait for the new build to finish and show
**"Active"**.

---

## Part 4: Rebuild the frontend

Stay in the project **root** folder — do NOT `cd` into `artifacts/staff-panel`
this time (running the build that way caused workspace-resolution bugs
before; using `--filter` from the root avoids that).

```
set PORT=3000
```
```
set BASE_PATH=/
```
```
set VITE_API_URL=https://staff-panel-production.up.railway.app
```
```
pnpm --filter @workspace/staff-panel run build
```

If this is a fresh checkout and you hit dependency errors here, see the
Troubleshooting section below before continuing.

---

## Part 5: Deploy the frontend to Firebase

```
firebase deploy --only hosting
```

When it finishes, it prints your live URL (something like
`https://gaw-de06f.web.app`). Open it, refresh, and confirm:
- The new dark blue/red color theme is showing
- After logging out and back in, the Developer Portal shows full
  rank/title/clearance editing controls for your account

---

## Troubleshooting: dependency errors on a fresh checkout

If you ever start from a completely fresh copy of the project (a new unzip,
a different computer, etc.) and hit errors during `pnpm install` or
`pnpm run build` on Windows, run these once, in the project root, in order:

```
pnpm approve-builds
```
(select `bcrypt` and `esbuild` with Space, Enter, then type `y` to confirm)

```
pnpm install
```

If you still get a `Cannot find module @rollup/...` / `lightningcss` /
`esbuild` platform error, this project's dependency-resolution issue for
Windows has already been fixed at the source (the old `pnpm-workspace.yaml`
had a section that stripped out every non-Linux binary, since it was
originally built for Replit). As long as you're using the current
`pnpm-workspace.yaml` from the latest zip, a plain `pnpm install` should
just work — you shouldn't need any of the old manual per-package patches
(`pnpm add -D -w @rollup/rollup-win32-x64-msvc`, etc.) anymore.

**Always build the frontend using the `--filter` form from the project
root** (`pnpm --filter @workspace/staff-panel run build`), not by `cd`-ing
into `artifacts/staff-panel` and running `pnpm run build` directly — the
latter can fail to resolve internal workspace packages correctly.

---

## Quick reference: what lives where

- **Frontend (website)**: Firebase Hosting — deployed with `firebase deploy --only hosting`
- **Backend (API)**: Railway — deployed automatically on every `git push`
- **Database**: Neon Postgres — schema changes pushed with `pnpm run push` inside `lib/db`
- **Code**: GitHub repo `gawadministrationholder-ui/staff-panel`, branch `main`
- **Granting permissions**: Developer Portal page on the live site (once you
  have Network Engineer clearance yourself)
