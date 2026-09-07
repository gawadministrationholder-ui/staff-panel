import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import { gt, asc, eq } from "drizzle-orm";
import { EmbedBuilder, type Client } from "discord.js";
import { config } from "./config";

const CRIMSON = 0xb91c1c;

// Wording — edit these to taste. {name} is filled per-recipient.
const INTRO =
  "A member of the Roman Parthia Remastered management staff has issued a punishment against you. Please review the information below to learn more about this action.";
const SIGNOFF = "Respectfully,\nRoman Parthia Remastered";
const WHAT_NOW =
  "If you think that the punishment given to you is not fair, you may contact a Deputy Head of Staff or anyone higher in authority.";

let since = new Date();

export function startPunishmentDmWatcher(client: Client) {
  if (!config.enablePunishmentDm) {
    console.log("[punishment-dm] disabled (BOT_PUNISHMENT_DM=false)");
    return;
  }
  console.log(`[punishment-dm] watching for new infractions (every ${config.logPollMs}ms)`);
  setInterval(() => {
    pollOnce(client).catch((err) => console.error("[punishment-dm]", err));
  }, config.logPollMs);
}

async function pollOnce(client: Client) {
  const newInfractions = await db
    .select()
    .from(schema.staffInfractions)
    .where(gt(schema.staffInfractions.createdAt, since))
    .orderBy(asc(schema.staffInfractions.createdAt));

  for (const inf of newInfractions) {
    const at = new Date(inf.createdAt);
    if (at > since) since = at;

    // Find the punished staff member's Discord ID via the linked panel account.
    const staff = (
      await db.select().from(schema.users).where(eq(schema.users.id, inf.staffId))
    )[0];
    if (!staff?.discordId) {
      console.warn(`[punishment-dm] no Discord ID for ${inf.staffName}; skipping DM`);
      continue;
    }

    const docLine = config.siteUrl
      ? `**You can access your punishment document here:**\n[Link](${config.siteUrl}/punishment-document?id=${inf.id})`
      : "**Your punishment document is available in the staff panel.**";

    const embed = new EmbedBuilder()
      .setColor(CRIMSON)
      .setTitle("Roman Parthia Remastered: Administrative Punishment")
      .setDescription(
        `Dear ${staff.robloxUsername},\n\n${INTRO}\n\n${SIGNOFF}`,
      )
      .addFields(
        { name: "Punishment Type:", value: titleCase(inf.infraction) },
        { name: "\u200b", value: docLine },
        { name: "What can you do now?", value: WHAT_NOW },
      )
      .setFooter({ text: "Roman Parthia Remastered" })
      .setTimestamp(at);

    try {
      const discordUser = await client.users.fetch(staff.discordId);
      await discordUser.send({ embeds: [embed] });
      console.log(`[punishment-dm] sent ${inf.infraction} notice to ${staff.robloxUsername}`);
    } catch (err) {
      console.warn(`[punishment-dm] could not DM ${staff.robloxUsername} (DMs closed?)`, err);
    }
  }
}

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
