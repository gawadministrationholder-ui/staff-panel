import { REST, Routes } from "discord.js";
import { config, assertDeployConfig } from "./config";
import { commands } from "./commands";

// Registers slash commands to your guild. Run once after adding/changing commands:
//   pnpm --filter @workspace/discord-bot deploy-commands
assertDeployConfig();

const body = Object.values(commands).map((c) => c.data);
const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log(`Deploying ${body.length} command(s) to guild ${config.guildId}...`);
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
    console.log("✅ Commands deployed.");
  } catch (err) {
    console.error("Failed to deploy commands:", err);
    process.exit(1);
  }
})();
