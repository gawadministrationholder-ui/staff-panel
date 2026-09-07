import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getPanelUserByDiscordId(discordId: string) {
  const rows = await db.select().from(schema.users).where(eq(schema.users.discordId, discordId));
  return rows[0];
}

export async function getRankByDiscordId(discordId: string): Promise<number> {
  const user = await getPanelUserByDiscordId(discordId);
  if (!user || user.suspended) return 0;
  return user.rank ?? 0;
}
