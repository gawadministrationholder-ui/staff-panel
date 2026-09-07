# Deploying Your Site to Firebase — Full Walkthrough

Follow this top to bottom. Every command below is something you type into a
terminal and press Enter. Don't skip steps.

---

## Step 0: Open a terminal

- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter.
- **Windows**: Press the Windows key, type "PowerShell", press Enter.
- **VS Code**: If you have the project open in VS Code, use the menu
  `Terminal > New Terminal` — this is often easiest since it starts in the
  right folder already.

Every command in this guide gets typed into that terminal window, one at a
time, pressing Enter after each.

---

## Step 1: Get the project folder onto your computer

1. Take the `project-firebase-ready.zip` file I gave you and unzip it
   somewhere you'll remember, e.g. your Desktop.
2. In your terminal, move into that folder. Example (adjust the path to
   wherever you unzipped it):
   ```
   cd Desktop/project-firebase-ready
   ```
3. Confirm you're in the right place by running:
   ```
   ls
   ```
   You should see files like `firebase.json`, `package.json`, `functions`,
   `artifacts`, `lib` listed.

---

## Step 2: Install Node.js (skip if you already have it)

Check if you already have it:
```
node --version
```
If you see something like `v20.x.x` or higher, skip to Step 3.

If you get an error ("command not found"), install Node.js:
- Go to https://nodejs.org
- Download the "LTS" version for your operating system
- Run the installer, click through with defaults
- Close and reopen your terminal, then run `node --version` again to confirm

---

## Step 3: Install pnpm

This project uses `pnpm` instead of `npm` for most parts. Install it:
```
npm install -g pnpm
```
Confirm it worked:
```
pnpm --version
```

---

## Step 4: Install the Firebase CLI tool

```
npm install -g firebase-tools
```
Confirm it worked:
```
firebase --version
```

---

## Step 5: Log into Firebase

```
firebase login
```
This opens a browser window. Sign in with your Google account and click
"Allow". Once it says "Success!" in the terminal, come back.

---

## Step 6: Create a Firebase project

1. Go to https://console.firebase.google.com in your browser.
2. Click **"Add project"** (or "Create a project").
3. Give it a name (e.g. "my-staff-panel"). Click Continue.
4. It'll ask about Google Analytics — you can turn this off, it's not needed.
   Click "Create project", then wait for it to finish, then click "Continue".
5. You now have a Firebase project. Note its **Project ID** — it's shown
   under the project name in the console, usually a lowercase-with-dashes
   version of the name you typed (e.g. `my-staff-panel-a1b2c`).

### Upgrade to the Blaze plan (required for Cloud Functions)

1. In the Firebase console, look at the bottom-left corner for a section
   called "Spark Plan" with an "Upgrade" button/link. Click it.
2. Choose **Blaze (Pay as you go)**.
3. It will ask you to link a billing account / add a payment method.
   Add a card. Firebase's free tier is generous (2 million function calls a
   month free) — you will not be charged unless you go way past that.
4. Confirm the upgrade.

### Connect your project folder to this Firebase project

Back in your terminal (still inside the project folder):
```
firebase use --add
```
- It'll show a list of your Firebase projects — use arrow keys to select the
  one you just created, press Enter.
- It'll ask for an alias — type `default` and press Enter.

---

## Step 7: Set up your Neon database (if you haven't already)

1. Go to https://neon.tech and sign up (GitHub login is fastest).
2. Click "Create a project". Give it any name. Pick a region close to you
   (e.g. "US East" if you're in the US).
3. Once created, look for **"Connection Details"** or **"Connection string"**
   on the project dashboard. It looks like:
   ```
   postgresql://neondb_owner:AbCdEf123@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy this entire string.** You'll paste it twice below — once into a
   terminal command, once into a Firebase secret.

---

## Step 8: Set your secrets in Firebase

These are private values (passwords/keys) the backend needs. Each command
will prompt you to type/paste a value, then press Enter, then press
`Ctrl+D` (Mac/Linux) or `Ctrl+Z` then Enter (Windows) to finish entering it.

**8a. Database connection string:**
```
firebase functions:secrets:set DATABASE_URL
```
Paste your Neon connection string from Step 7, press Enter, then Ctrl+D.

**8b. Session secret** (a random password used to secure login sessions):

First generate one:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
This prints a long random string like `a3f9c1...`. Copy it. Then run:
```
firebase functions:secrets:set SESSION_SECRET
```
Paste that random string, press Enter, then Ctrl+D.

**8c. Roblox Group ID:**
```
firebase functions:secrets:set ROBLOX_GROUP_ID
```
Type your Roblox group's numeric ID, press Enter, then Ctrl+D.

**8d. Roblox Cookie** (only if your app uses this for group-role lookups):
```
firebase functions:secrets:set ROBLOX_COOKIE
```
Paste your `.ROBLOSECURITY` cookie value, press Enter, then Ctrl+D.

For each of these, Firebase will confirm with something like
`✔  Created a new secret version projects/.../secrets/DATABASE_URL/versions/1`.

---

## Step 9: Create the database tables on Neon

Still in your terminal, at the project root folder:

**9a.** Set the connection string as a temporary variable for this terminal
session (paste your real Neon string):
```
export DATABASE_URL="postgresql://neondb_owner:AbCdEf123@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require"
```
(Windows PowerShell users: use `$env:DATABASE_URL="..."` instead of `export`)

**9b.** Move into the database folder and install its dependencies:
```
cd lib/db
pnpm install
```

**9c.** Push the schema (creates all the tables):
```
pnpm run push
```
It may ask a yes/no question about creating tables — type `y` and press
Enter, or just press Enter if it defaults to yes.

**9d.** Go back to the project root:
```
cd ../..
```

---

## Step 10: Build the website frontend

**10a.** Move into the frontend folder:
```
cd artifacts/staff-panel
```

**10b.** Install its dependencies and build it (this is one long command,
copy the whole thing):
```
PORT=3000 BASE_PATH=/ pnpm install && PORT=3000 BASE_PATH=/ pnpm run build
```
(Windows PowerShell users, run these as two separate lines instead:)
```
$env:PORT="3000"; $env:BASE_PATH="/"; pnpm install
$env:PORT="3000"; $env:BASE_PATH="/"; pnpm run build
```
This will take a minute or two. When it's done you'll see a "build
complete" style message.

**10c.** Go back to the project root:
```
cd ../..
```

---

## Step 11: Install the Cloud Function's dependencies

```
cd functions
npm install
cd ..
```
(Note: this one step uses `npm`, not `pnpm` — that's intentional.)

---

## Step 12: Deploy everything

From the project root folder:
```
firebase deploy --only hosting,functions
```

This will take a few minutes. You'll see a lot of text scroll by — that's
normal. It's building your backend, uploading it, and uploading your
website. Wait for it to finish.

At the end, you should see something like:
```
✔  Deploy complete!

Hosting URL: https://your-project-id.web.app
```

**That URL is your live website.** Open it in a browser.

---

## Troubleshooting

**"command not found: pnpm" or "firebase"** — the install in that step
didn't finish, or you need to close and reopen your terminal after
installing. Try the install command again.

**"Error: Your project must be on the Blaze (pay-as-you-go) plan..."** —
go back to Step 6 and make sure you actually completed the billing upgrade.

**Something about "permission denied" during npm install -g** on Mac/Linux —
try again with `sudo` in front, e.g. `sudo npm install -g firebase-tools`,
enter your computer's password when asked.

**The site loads but login/API calls fail** — double check every secret in
Step 8 was actually set (typos in the value are the most common cause).
You can view the deployed function's logs with:
```
firebase functions:log
```

**If anything else goes wrong**, copy the exact error message you see and
send it to me — I'll tell you exactly what it means and what to do.

---

## Making changes later

Any time you edit the code and want to update the live site:
```
cd artifacts/staff-panel
PORT=3000 BASE_PATH=/ pnpm run build
cd ../..
firebase deploy --only hosting,functions
```

---

## One thing that stays outside Firebase

Your Discord bot needs to keep running somewhere else (Replit, a VPS, etc.)
— Firebase can't host it, since it needs to stay constantly connected to
Discord, which Cloud Functions (which turn on/off per request) can't do.
Just make sure it's using the same Neon `DATABASE_URL` as the website.
