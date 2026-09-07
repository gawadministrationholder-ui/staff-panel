# Deploying: Frontend on Firebase (free) + Backend on Render (free)

Since Cloud Functions need the paid Blaze plan, here's the free alternative:
- **Frontend** (the website itself) → Firebase Hosting (free)
- **Backend** (login, database, everything with `/api/...`) → Render.com (free tier)
- **Database** → Neon (you already set this up)

Render's free tier "sleeps" your backend after 15 minutes of no traffic — the
next request after that takes ~30-50 seconds to wake it back up. Everything
after that is normal speed. This is the tradeoff for it being free.

---

## Part 1: Get your code onto GitHub

Render needs your code to live in a GitHub repository (it can't deploy from a
zip file on your computer). If you don't already have a GitHub account:

1. Go to https://github.com and sign up (free).

Now push your project there:

**1a.** In your terminal, from the project folder, run:
```
git init
git add .
git commit -m "Initial commit"
```
(If `git` isn't installed, download it from https://git-scm.com/downloads,
install it with defaults, then reopen your terminal and try again.)

**1b.** Create a new empty repository on GitHub:
- Go to https://github.com/new
- Name it anything (e.g. `staff-panel`)
- Leave it as **Private** if you want (Render can still access private repos)
- Do NOT check "Add a README" — leave it completely empty
- Click "Create repository"

**1c.** GitHub will show you commands under "…or push an existing
repository from the command line". They'll look like this (copy the exact
ones GitHub shows you, since your username/repo name will be different):
```
git remote add origin https://github.com/YOUR-USERNAME/staff-panel.git
git branch -M main
git push -u origin main
```
Run those three lines in your terminal. It may open a browser to confirm
your GitHub login the first time.

---

## Part 2: Create the backend on Render

**2a.** Go to https://render.com and sign up (using "Sign up with GitHub" is
easiest — it connects your account automatically).

**2b.** Click **"New +"** (top right) → **"Web Service"**.

**2c.** Connect your GitHub repo — find the one you just pushed (e.g.
`staff-panel`) and click "Connect".

**2d.** Fill in the settings:
- **Name**: anything, e.g. `staff-panel-api`
- **Region**: pick whichever is closest to you
- **Branch**: `main`
- **Root Directory**: leave this **blank** (the whole repo is needed since
  it's a monorepo)
- **Runtime**: Node
- **Build Command**:
  ```
  corepack enable && pnpm install && pnpm --filter @workspace/api-server build
  ```
- **Start Command**:
  ```
  pnpm --filter @workspace/api-server start
  ```
- **Instance Type**: Free

**2e.** Scroll down to **"Environment Variables"** and add these (click "Add
Environment Variable" for each):

| Key | Value |
|---|---|
| `DATABASE_URL` | your Neon connection string |
| `SESSION_SECRET` | a long random string (generate with the command below) |
| `ROBLOX_GROUP_ID` | your Roblox group's numeric ID |
| `ROBLOX_COOKIE` | your `.ROBLOSECURITY` cookie, if used |
| `NODE_ENV` | `production` |

To generate a `SESSION_SECRET`, run this in your terminal and copy the
output:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2f.** Click **"Create Web Service"** at the bottom. Render will start
building — this takes a few minutes the first time. Watch the log output;
wait for it to say something like "Server listening" and show a green
"Live" status.

**2g.** Once live, copy your backend's URL from the top of the Render page
— it looks like:
```
https://staff-panel-api.onrender.com
```
**Save this URL — you need it in the next part.**

---

## Part 3: Push the database schema to Neon (if you haven't already)

```
export DATABASE_URL="your-neon-connection-string-here"
cd lib/db
pnpm install
pnpm run push
cd ../..
```
(Windows PowerShell: use `$env:DATABASE_URL="..."` instead of `export`)

---

## Part 4: Build the frontend, pointed at your Render backend

```
cd artifacts/staff-panel
```

Windows Command Prompt:
```
set PORT=3000
set BASE_PATH=/
set VITE_API_URL=https://staff-panel-api.onrender.com
pnpm install
pnpm run build
```

Windows PowerShell:
```
$env:PORT="3000"; $env:BASE_PATH="/"; $env:VITE_API_URL="https://staff-panel-api.onrender.com"
pnpm install
pnpm run build
```

Mac/Linux:
```
PORT=3000 BASE_PATH=/ VITE_API_URL=https://staff-panel-api.onrender.com pnpm install
PORT=3000 BASE_PATH=/ VITE_API_URL=https://staff-panel-api.onrender.com pnpm run build
```

**Replace `https://staff-panel-api.onrender.com` with your actual Render URL
from Part 2, step 2g.**

Then go back to the project root:
```
cd ../..
```

---

## Part 5: Deploy the frontend to Firebase

```
firebase deploy --only hosting
```

At the end you'll see:
```
✔  Deploy complete!
Hosting URL: https://gaw-de06f.web.app
```

**That's your live website.**

---

## Redeploying later

**Backend changes**: just push to GitHub (`git add . && git commit -m "..." && git push`)
— Render automatically redeploys on every push to `main`.

**Frontend changes**: repeat Part 4's build commands, then run
`firebase deploy --only hosting` again.

---

## Troubleshooting

**Render build fails with a pnpm-related error** — check the build log for
the specific error and send it to me.

**The site loads, but nothing works / login fails** — open your browser's
DevTools (press F12), go to the "Console" or "Network" tab, try logging in
again, and look for a red error. Common cause: `VITE_API_URL` wasn't set
correctly when you built the frontend — you'd need to rebuild it (Part 4)
with the correct Render URL.

**"CORS error" in the browser console** — send me the exact error text, but
this shouldn't happen since the backend already allows cross-origin
requests with credentials.

**Render backend goes to sleep and the first request is slow** — this is
expected on the free tier. If it becomes a problem, Render has a paid tier
that keeps it always-on.

---

## The Discord bot

Still needs to run somewhere separate (it can't go on Render's free web
service type the same way, and definitely not on Firebase) — keep it
wherever it currently runs (e.g. Replit), just pointed at the same Neon
`DATABASE_URL`.
