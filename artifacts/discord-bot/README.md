# Roman Parthia — Discord Bot

A Discord bot for the Roman Parthia Remastered staff panel. It shares the same
PostgreSQL database as the site (`@workspace/db`), so it reads and writes the
exact same data.

## What it does

1. **Posts moderation logs & global bans to Discord** — watches the database and
   sends a styled embed to your log channel for each new entry, formatted like:
   **ID** / **Moderator** name (id) / **Target** name (id) / **Reason** /
   **Action Taken**, with the proof image attached when one is on record. Covers
   Discord moderation logs, Roblox moderation logs, and global bans.
2. **DMs punished staff** — when a new infraction (e.g. a Strike) is recorded in
   the panel, the bot DMs that staff member an "Administrative Punishment" notice
   with the punishment type and a link to their punishment document. (Toggle with
   `BOT_PUNISHMENT_DM`.)
3. **Syncs Roblox group ranks** — on demand via `/sync` and the `sync-ranks`
   script. The always-on loop is **off by default** (the API server already runs
   one); enable with `BOT_RANK_SYNC=true`.
4. **Slash commands** — staff can act from Discord.

> Note: the panel's Discord moderation table doesn't store a "Server" name, so
> the **Server** line is shown only when that data exists. Tell me if you want
> server + proof-image capture added to the panel to fully mirror the old bot.

## Slash commands

| Command | Who | What |
| --- | --- | --- |
| `/ping` | anyone | health check |
| `/whoami` | anyone | shows the panel rank linked to your Discord |
| `/staff` | anyone | lists the staff roster (rank 97+) |
| `/lookup user:<name or id>` | anyone | a Roblox user's ban status + mod history |
| `/globalban roblox_id username reason` | rank 150+ | issue a global ban |
| `/unban roblox_id` | rank 150+ | lift a global ban |
| `/sync` | rank 150+ | sync all ranks from Roblox now |

Management commands are gated by the rank on the Discord user's **linked panel
account** (matched via `discord_id`). Change the threshold with `BOT_MANAGE_RANK`.

## Setup

### 1. Create the bot application
- Go to https://discord.com/developers/applications → New Application.
- Add a **Bot**, copy its **token**.
- Copy the **Application (client) ID** from General Information.
- Invite it to your server with the `bot` and `applications.commands` scopes and
  permission to view/send in your log channel.

### 2. Secrets (Replit → Tools → Secrets, or environment variables)
```
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-id
DISCORD_GUILD_ID=your-server-id
DISCORD_LOG_CHANNEL_ID=channel-id-for-mod-logs
ROBLOX_GROUP_ID=903368541
SITE_URL=https://your-site-url        # used for punishment-document links in DMs
DATABASE_URL=...                 # same value the site uses
# optional
BOT_PUNISHMENT_DM=true           # DM staff when they receive an infraction
BOT_RANK_SYNC=false              # true = bot also runs a continuous rank sync
BOT_MANAGE_RANK=150              # rank required for ban/unban/sync
BOT_LOG_POLL_MS=10000            # how often to check for new logs
```
> `DATABASE_URL` must be the **same database** as the website.

### 3. Register the slash commands (run once, and after any command change)
```
pnpm install
pnpm --filter @workspace/discord-bot deploy-commands
```

### 4. Start the bot
```
pnpm --filter @workspace/discord-bot start
```

## Running on Replit alongside the site
Replit runs one main process (the website). To keep the bot online too, run it as
its own always-on process — the simplest options:
- **Separate Repl / Deployment** pointed at this folder with the start command above, or
- A **Background Worker** / Reserved-VM deployment whose run command is
  `pnpm --filter @workspace/discord-bot start`.

Set the same Secrets in whichever environment runs the bot.
