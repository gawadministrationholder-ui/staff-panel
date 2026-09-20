import { Client, GatewayIntentBits, Events, type Interaction } from "discord.js";
import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import { config, assertRuntimeConfig } from "./config";
import { commands } from "./commands";
import { startLogWatcher } from "./log-watcher";
import { startPunishmentDmWatcher } from "./punishment-dm";
import { startRankSyncLoop } from "./rank-sync";

assertRuntimeConfig();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

/**
 * Writes a "still alive" timestamp to the DB every minute so the staff
 * panel's status widget can show the bot as online/offline without needing
 * to reach the Discord gateway itself.
 */
function startHeartbeat() {
  const beat = () =>
    db
      .insert(schema.botHeartbeats)
      .values({ key: "discord-bot", lastSeenAt: new Date() })
      .onConflictDoUpdate({ target: schema.botHeartbeats.key, set: { lastSeenAt: new Date() } })
      .catch((err) => console.error("[heartbeat] failed to record:", err));
  beat();
  setInterval(beat, 60000);
}

client.once(Events.ClientReady, (c) => {
  console.log(`🏛️  Logged in as ${c.user.tag}`);
  startLogWatcher(client);
  startPunishmentDmWatcher(client);
  startHeartbeat();
  if (config.enableRankSyncLoop) startRankSyncLoop();
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands[interaction.commandName];
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error handling /${interaction.commandName}:`, err);
    const msg = "⚠️ Something went wrong running that command.";
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(msg).catch(() => {});
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(config.token);
