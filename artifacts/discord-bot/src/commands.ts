import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getRankByDiscordId, getPanelUserByDiscordId } from "./permissions";
import { syncAllRanks } from "./rank-sync";
import { getRobloxUserInfo, getRobloxIdByUsername } from "./roblox";
import { config } from "./config";

interface Command {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (i: ChatInputCommandInteraction) => Promise<void>;
}

const GOLD = 0xd4af37;
const CRIMSON = 0xb91c1c;

export const commands: Record<string, Command> = {
  ping: {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Check that the bot is alive")
      .toJSON(),
    execute: async (i) => {
      await i.reply({ content: "🏛️ Pong — the Empire stands.", ephemeral: true });
    },
  },

  whoami: {
    data: new SlashCommandBuilder()
      .setName("whoami")
      .setDescription("Show the panel rank linked to your Discord account")
      .toJSON(),
    execute: async (i) => {
      const user = await getPanelUserByDiscordId(i.user.id);
      if (!user) {
        await i.reply({ content: "You are not linked to a panel account.", ephemeral: true });
        return;
      }
      await i.reply({
        content: `**${user.robloxUsername}** — ${user.rankName || "rank " + user.rank} (rank ${user.rank})`,
        ephemeral: true,
      });
    },
  },

  staff: {
    data: new SlashCommandBuilder()
      .setName("staff")
      .setDescription("List the active staff roster")
      .toJSON(),
    execute: async (i) => {
      await i.deferReply();
      const rows = await db.select().from(schema.users).orderBy(desc(schema.users.rank));
      const staff = rows.filter((u) => u.rank >= 97);
      const lines = staff
        .slice(0, 40)
        .map((s) => `\`${String(s.rank).padStart(3)}\` **${s.robloxUsername}**${s.rankName ? ` — ${s.rankName}` : ""}`);
      const embed = new EmbedBuilder()
        .setTitle("Roman Parthia Remastered — Staff Roster")
        .setColor(GOLD)
        .setDescription(lines.join("\n") || "No staff found.")
        .setFooter({ text: `${staff.length} staff member(s)` });
      await i.editReply({ embeds: [embed] });
    },
  },

  lookup: {
    data: new SlashCommandBuilder()
      .setName("lookup")
      .setDescription("Look up a Roblox user's moderation history")
      .addStringOption((o) =>
        o.setName("user").setDescription("Roblox username or user ID").setRequired(true),
      )
      .toJSON(),
    execute: async (i) => {
      await i.deferReply();
      const input = i.options.getString("user", true).trim();
      const robloxId = /^\d+$/.test(input) ? input : await getRobloxIdByUsername(input);
      if (!robloxId) {
        await i.editReply(`Could not resolve a Roblox user from "${input}".`);
        return;
      }
      const info = await getRobloxUserInfo(robloxId);
      const logs = await db
        .select()
        .from(schema.moderationLogs)
        .where(eq(schema.moderationLogs.targetId, robloxId))
        .orderBy(desc(schema.moderationLogs.createdAt));
      const ban = (
        await db.select().from(schema.globalBans).where(eq(schema.globalBans.userId, robloxId))
      )[0];

      const embed = new EmbedBuilder()
        .setTitle(`Lookup — ${info?.name || robloxId}`)
        .setColor(ban ? CRIMSON : GOLD)
        .addFields(
          {
            name: "Global Ban",
            value: ban ? `⛔ ${ban.reason} (by ${ban.bannedByName})` : "✅ None",
          },
          {
            name: `Moderation Logs (${logs.length})`,
            value:
              logs
                .slice(0, 8)
                .map((l) => `• **${l.action}** — ${l.reason}`)
                .join("\n")
                .slice(0, 1024) || "None on record.",
          },
        )
        .setFooter({ text: `Roblox ID: ${robloxId}` });
      await i.editReply({ embeds: [embed] });
    },
  },

  globalban: {
    data: new SlashCommandBuilder()
      .setName("globalban")
      .setDescription("Issue a global ban (Senior Admin+)")
      .addStringOption((o) => o.setName("roblox_id").setDescription("Roblox user ID").setRequired(true))
      .addStringOption((o) => o.setName("username").setDescription("Roblox username").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason for the ban").setRequired(true))
      .toJSON(),
    execute: async (i) => {
      const me = await getPanelUserByDiscordId(i.user.id);
      if (!me || me.rank < config.manageRank) {
        await i.reply({ content: `⛔ You need rank ${config.manageRank}+ to issue a global ban.`, ephemeral: true });
        return;
      }
      const robloxId = i.options.getString("roblox_id", true);
      const username = i.options.getString("username", true);
      const reason = i.options.getString("reason", true);
      await db
        .insert(schema.globalBans)
        .values({ userId: robloxId, username, reason, bannedBy: me.robloxUserId, bannedByName: me.robloxUsername })
        .onConflictDoNothing();
      // The log-watcher will post the ban embed automatically.
      await i.reply({ content: `⛔ Global ban recorded for **${username}** (${robloxId}).` });
    },
  },

  unban: {
    data: new SlashCommandBuilder()
      .setName("unban")
      .setDescription("Lift a global ban (Senior Admin+)")
      .addStringOption((o) => o.setName("roblox_id").setDescription("Roblox user ID").setRequired(true))
      .toJSON(),
    execute: async (i) => {
      const rank = await getRankByDiscordId(i.user.id);
      if (rank < config.manageRank) {
        await i.reply({ content: `⛔ You need rank ${config.manageRank}+ to lift a global ban.`, ephemeral: true });
        return;
      }
      const robloxId = i.options.getString("roblox_id", true);
      await db.delete(schema.globalBans).where(eq(schema.globalBans.userId, robloxId));
      await i.reply({ content: `✅ Global ban lifted for Roblox ID ${robloxId}.` });
    },
  },

  sync: {
    data: new SlashCommandBuilder()
      .setName("sync")
      .setDescription("Sync all linked members' Roblox group ranks now (Senior Admin+)")
      .toJSON(),
    execute: async (i) => {
      const rank = await getRankByDiscordId(i.user.id);
      if (rank < config.manageRank) {
        await i.reply({ content: `⛔ You need rank ${config.manageRank}+ to run a sync.`, ephemeral: true });
        return;
      }
      await i.deferReply();
      const { synced, total } = await syncAllRanks();
      await i.editReply(`✅ Rank sync complete — updated ${synced}/${total} members.`);
    },
  },
};
