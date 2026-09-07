import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import { gt, asc } from "drizzle-orm";
import { EmbedBuilder, type Client, type TextChannel } from "discord.js";
import { config } from "./config";

const CRIMSON = 0xb91c1c;
const DARK_RED = 0x7f1d1d;

// Track the newest row already posted per feed (since startup) so nothing double-posts.
const since = {
  discord: new Date(),
  roblox: new Date(),
  ban: new Date(),
};

export function startLogWatcher(client: Client) {
  if (!config.logChannelId) {
    console.warn("[log-watcher] DISCORD_LOG_CHANNEL_ID not set — log posting disabled.");
    return;
  }
  console.log(`[log-watcher] watching moderation feeds (every ${config.logPollMs}ms)`);
  setInterval(() => {
    pollOnce(client).catch((err) => console.error("[log-watcher]", err));
  }, config.logPollMs);
}

async function resolveChannel(client: Client): Promise<TextChannel | null> {
  try {
    const ch = await client.channels.fetch(config.logChannelId);
    return ch && ch.isTextBased() ? (ch as TextChannel) : null;
  } catch {
    return null;
  }
}

// Pull a usable image URL out of a free-form field (plain URL or JSON containing one).
function extractImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp)/i.test(trimmed)) return trimmed.split(/\s/)[0];
  const match = trimmed.match(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)/i);
  return match ? match[0] : null;
}

function moderationEmbed(opts: {
  id: string;
  moderator: string;
  target: string;
  reason: string;
  action: string;
  server?: string | null;
  image?: string | null;
  createdAt: Date;
  color?: number;
}): EmbedBuilder {
  const lines = [
    `**ID:** ${opts.id}`,
    `**Moderator:** ${opts.moderator}`,
    `**Target:** ${opts.target}`,
    `**Reason:** ${opts.reason || "—"}`,
  ];
  if (opts.server) lines.push(`**Server:** ${opts.server}`);
  lines.push(`**Action Taken:** ${opts.action || "—"}`);

  const embed = new EmbedBuilder()
    .setColor(opts.color ?? CRIMSON)
    .setDescription(lines.join("\n"))
    .setFooter({ text: "Roman Parthia Remastered" })
    .setTimestamp(opts.createdAt);
  if (opts.image) embed.setImage(opts.image);
  return embed;
}

async function pollOnce(client: Client) {
  const channel = await resolveChannel(client);
  if (!channel) return;

  // Discord moderation logs
  const discordLogs = await db
    .select()
    .from(schema.discordModerationLogs)
    .where(gt(schema.discordModerationLogs.createdAt, since.discord))
    .orderBy(asc(schema.discordModerationLogs.createdAt));
  for (const log of discordLogs) {
    await channel.send({
      embeds: [
        moderationEmbed({
          id: log.id,
          moderator: `${log.moderatorName} (${log.moderatorId})`,
          target: `${log.targetName} (${log.targetId})`,
          reason: log.reason,
          action: log.action,
          image: extractImageUrl(log.details),
          createdAt: new Date(log.createdAt),
        }),
      ],
    });
    const at = new Date(log.createdAt);
    if (at > since.discord) since.discord = at;
  }

  // Roblox moderation logs
  const robloxLogs = await db
    .select()
    .from(schema.robloxModerationLogs)
    .where(gt(schema.robloxModerationLogs.createdAt, since.roblox))
    .orderBy(asc(schema.robloxModerationLogs.createdAt));
  for (const log of robloxLogs) {
    await channel.send({
      embeds: [
        moderationEmbed({
          id: log.warningId || log.id,
          moderator: log.moderatorName ? `${log.moderatorName} (${log.moderatorId})` : log.moderatorId,
          target: log.targetUsername ? `${log.targetUsername} (${log.targetRobloxId})` : log.targetRobloxId,
          reason: log.reason,
          action: log.action,
          image: extractImageUrl(log.evidence),
          createdAt: new Date(log.createdAt),
        }),
      ],
    });
    const at = new Date(log.createdAt);
    if (at > since.roblox) since.roblox = at;
  }

  // Global bans
  const bans = await db
    .select()
    .from(schema.globalBans)
    .where(gt(schema.globalBans.createdAt, since.ban))
    .orderBy(asc(schema.globalBans.createdAt));
  for (const ban of bans) {
    await channel.send({
      embeds: [
        moderationEmbed({
          id: ban.id,
          moderator: ban.bannedByName,
          target: `${ban.username} (${ban.userId})`,
          reason: ban.reason,
          action: "Permanent Global Ban",
          color: DARK_RED,
          createdAt: new Date(ban.createdAt),
        }),
      ],
    });
    const at = new Date(ban.createdAt);
    if (at > since.ban) since.ban = at;
  }
}
