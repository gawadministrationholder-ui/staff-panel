// Central configuration, read from environment (Replit Secrets / process.env).
export const config = {
  token: process.env.DISCORD_BOT_TOKEN || "",
  clientId: process.env.DISCORD_CLIENT_ID || "",
  guildId: process.env.DISCORD_GUILD_ID || "",
  logChannelId: process.env.DISCORD_LOG_CHANNEL_ID || "",
  robloxGroupId: process.env.ROBLOX_GROUP_ID || "",
  // Public site URL used to build punishment-document links in DMs, e.g. https://yoursite.com
  siteUrl: (process.env.SITE_URL || "").replace(/\/$/, ""),
  // DM punished staff automatically when a new infraction is recorded.
  enablePunishmentDm: (process.env.BOT_PUNISHMENT_DM || "true").toLowerCase() === "true",
  logPollMs: Number(process.env.BOT_LOG_POLL_MS || 10000),
  // The API server already runs a continuous rank sync. Leave this off unless
  // you want the bot to ALSO run its own sync loop. Set BOT_RANK_SYNC=true to enable.
  enableRankSyncLoop: (process.env.BOT_RANK_SYNC || "false").toLowerCase() === "true",
  rankSyncIntervalMs: Number(process.env.BOT_RANK_SYNC_MS || 60000),
  // Rank required to run management commands (global ban / unban / sync).
  manageRank: Number(process.env.BOT_MANAGE_RANK || 150),
};

export function assertRuntimeConfig() {
  if (!config.token) throw new Error("DISCORD_BOT_TOKEN is required to start the bot.");
}

export function assertDeployConfig() {
  if (!config.token) throw new Error("DISCORD_BOT_TOKEN is required.");
  if (!config.clientId) throw new Error("DISCORD_CLIENT_ID is required to deploy commands.");
  if (!config.guildId) throw new Error("DISCORD_GUILD_ID is required to deploy commands.");
}
