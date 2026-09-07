import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import { eq } from "drizzle-orm";
import { getRobloxGroupRole, getRobloxAvatar, getRobloxUserInfo } from "./roblox";
import { config } from "./config";

// Pull every linked user's current group rank from Roblox and write it to the panel DB.
export async function syncAllRanks(): Promise<{ synced: number; total: number }> {
  if (!config.robloxGroupId) {
    console.warn("[rank-sync] ROBLOX_GROUP_ID not set — skipping.");
    return { synced: 0, total: 0 };
  }
  const users = await db.select().from(schema.users);
  let synced = 0;
  for (const user of users) {
    try {
      const role = await getRobloxGroupRole(user.robloxUserId, config.robloxGroupId);
      const avatar = await getRobloxAvatar(user.robloxUserId);
      const info = await getRobloxUserInfo(user.robloxUserId);
      await db
        .update(schema.users)
        .set({
          rank: role.rank,
          rankName: role.name,
          robloxAvatar: avatar,
          robloxUsername: info?.name || user.robloxUsername,
        })
        .where(eq(schema.users.id, user.id));
      synced++;
    } catch (err) {
      console.error(`[rank-sync] failed for ${user.robloxUsername}:`, err);
    }
  }
  return { synced, total: users.length };
}

export function startRankSyncLoop() {
  console.log(`[rank-sync] loop enabled (every ${config.rankSyncIntervalMs}ms)`);
  void syncAllRanks();
  setInterval(() => void syncAllRanks(), config.rankSyncIntervalMs);
}
