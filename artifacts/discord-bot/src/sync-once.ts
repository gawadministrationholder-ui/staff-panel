import { syncAllRanks } from "./rank-sync";

// One-off rank sync from the command line:
//   pnpm --filter @workspace/discord-bot sync-ranks
(async () => {
  const { synced, total } = await syncAllRanks();
  console.log(`Rank sync complete — updated ${synced}/${total} members.`);
  process.exit(0);
})();
