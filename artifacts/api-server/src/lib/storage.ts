import { db } from "@workspace/db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import * as schema from "@workspace/db";
import type {
  User,
  InsertUser,
  ModerationLog,
  InsertModerationLog,
  DiscordModerationLog,
  InsertDiscordModerationLog,
  RobloxModerationLog,
  InsertRobloxModerationLog,
  GlobalBan,
  InsertGlobalBan,
  BotPermission,
  InsertBotPermission,
  BanProtection,
  InsertBanProtection,
  AccessChangeRequest,
} from "@workspace/db";

export class PostgresStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async getUserByRobloxId(robloxUserId: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.robloxUserId, robloxUserId));
    return result[0];
  }

  async getUserByStaffId(staffId: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.staffId, staffId));
    return result[0];
  }

  async generateStaffId(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let staffId: string;
    let exists = true;
    while (exists) {
      const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      staffId = `ARC-${code}`;
      const existing = await this.getUserByStaffId(staffId);
      exists = !!existing;
    }
    return staffId!;
  }

  async createUser(
    insertUser: InsertUser & { robloxAvatar: string; rank: number; rankName: string; robloxUsername: string; clearance?: string },
  ): Promise<User> {
    const staffId = await this.generateStaffId();
    const result = await db.insert(schema.users).values({ ...insertUser, staffId }).returning();
    return result[0];
  }

  async updateUserRank(id: string, rank: number, rankName: string, avatar: string, username: string): Promise<void> {
    await db.update(schema.users).set({ rank, rankName, robloxAvatar: avatar, robloxUsername: username }).where(eq(schema.users.id, id));
  }

  async updateUserInfo(
    id: string,
    data: {
      discordUsername?: string;
      discordId?: string;
      email?: string;
      password?: string;
      rank?: number;
      rankName?: string;
      clearance?: string;
    },
  ): Promise<User> {
    const updateData: Record<string, string | number> = {};
    if (data.discordUsername !== undefined) updateData.discordUsername = data.discordUsername;
    if (data.discordId !== undefined) updateData.discordId = data.discordId;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.rank !== undefined) updateData.rank = data.rank;
    if (data.rankName !== undefined) updateData.rankName = data.rankName;
    if (data.clearance !== undefined) updateData.clearance = data.clearance;
    await db.update(schema.users).set(updateData).where(eq(schema.users.id, id));
    const updated = await this.getUser(id);
    if (!updated) throw new Error("User not found after update");
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async getAllStaff(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.rank));
  }

  async createLog(insertLog: InsertModerationLog): Promise<ModerationLog> {
    const result = await db.insert(schema.moderationLogs).values(insertLog).returning();
    return result[0];
  }

  async getAllLogs(): Promise<ModerationLog[]> {
    return await db.select().from(schema.moderationLogs).orderBy(desc(schema.moderationLogs.createdAt));
  }

  async getLogsByStaffId(staffId: string): Promise<ModerationLog[]> {
    return await db.select().from(schema.moderationLogs).where(eq(schema.moderationLogs.staffId, staffId)).orderBy(desc(schema.moderationLogs.createdAt));
  }

  async getStats() {
    const allUsers = await db.select().from(schema.users);
    const allLogs = await db.select().from(schema.moderationLogs);
    return {
      registeredUsers: allUsers.length,
      staffMembers: allUsers.filter((u) => u.rank >= 140).length,
      totalPunishments: allLogs.length,
      strikes: allLogs.filter((l) => l.action.toLowerCase().includes("strike")).length,
      warnings: allLogs.filter((l) => l.action.toLowerCase().includes("warning")).length,
      suspensions: allLogs.filter((l) => l.action.toLowerCase().includes("suspension")).length,
      terminations: allLogs.filter((l) => l.action.toLowerCase().includes("termination")).length,
      discordLinked: allUsers.filter((u) => u.discordUsername && u.discordUsername.length > 0).length,
    };
  }

  async logDiscordModeration(data: {
    platform: string;
    action: string;
    moderatorId: string;
    moderatorName: string;
    targetId: string;
    targetName: string;
    reason: string;
    details?: unknown;
  }): Promise<DiscordModerationLog> {
    const result = await db
      .insert(schema.discordModerationLogs)
      .values({
        platform: data.platform,
        action: data.action,
        moderatorId: data.moderatorId,
        moderatorName: data.moderatorName,
        targetId: data.targetId,
        targetName: data.targetName,
        reason: data.reason,
        details: data.details ? JSON.stringify(data.details) : null,
      })
      .returning();
    return result[0];
  }

  async getDiscordWarningCount(userId: string, platform: string): Promise<number> {
    const warnings = await db
      .select()
      .from(schema.discordModerationLogs)
      .where(and(eq(schema.discordModerationLogs.targetId, userId), eq(schema.discordModerationLogs.action, "warning"), eq(schema.discordModerationLogs.platform, platform)));
    return warnings.length;
  }

  async getAllDiscordLogs(): Promise<DiscordModerationLog[]> {
    return await db.select().from(schema.discordModerationLogs).orderBy(desc(schema.discordModerationLogs.createdAt));
  }

  async updateDiscordModeration(id: string, data: Partial<InsertDiscordModerationLog>): Promise<DiscordModerationLog> {
    await db.update(schema.discordModerationLogs).set(data).where(eq(schema.discordModerationLogs.id, id));
    const result = await db.select().from(schema.discordModerationLogs).where(eq(schema.discordModerationLogs.id, id));
    if (!result[0]) throw new Error("Moderation not found after update");
    return result[0];
  }

  async deleteDiscordModeration(id: string): Promise<void> {
    await db.delete(schema.discordModerationLogs).where(eq(schema.discordModerationLogs.id, id));
  }

  async getAllRobloxModerations(): Promise<RobloxModerationLog[]> {
    return await db.select().from(schema.robloxModerationLogs).orderBy(desc(schema.robloxModerationLogs.createdAt));
  }

  async updateRobloxModerationAcknowledgment(warningId: string, acknowledged: boolean): Promise<void> {
    await db.update(schema.robloxModerationLogs).set({ acknowledged }).where(eq(schema.robloxModerationLogs.warningId, warningId));
  }

  async getDiscordModerationsByTargetId(targetId: string): Promise<DiscordModerationLog[]> {
    return await db.select().from(schema.discordModerationLogs).where(eq(schema.discordModerationLogs.targetId, targetId)).orderBy(desc(schema.discordModerationLogs.createdAt));
  }

  async getRobloxModerationsByTargetId(targetId: string): Promise<import("@workspace/db").RobloxModerationLog[]> {
    return await db.select().from(schema.robloxModerationLogs).where(eq(schema.robloxModerationLogs.targetRobloxId, targetId)).orderBy(desc(schema.robloxModerationLogs.createdAt));
  }

  async createGlobalBan(data: InsertGlobalBan): Promise<GlobalBan> {
    const result = await db.insert(schema.globalBans).values(data).returning();
    return result[0];
  }

  async getGlobalBan(userId: string): Promise<GlobalBan | undefined> {
    const result = await db.select().from(schema.globalBans).where(eq(schema.globalBans.userId, userId));
    return result[0];
  }

  async getAllGlobalBans(): Promise<GlobalBan[]> {
    return await db.select().from(schema.globalBans).orderBy(desc(schema.globalBans.createdAt));
  }

  async deleteGlobalBan(userId: string): Promise<void> {
    await db.delete(schema.globalBans).where(eq(schema.globalBans.userId, userId));
  }

  async getBotPermission(userId: string): Promise<BotPermission | undefined> {
    const result = await db.select().from(schema.botPermissions).where(eq(schema.botPermissions.userId, userId));
    return result[0];
  }

  async createBotPermission(data: InsertBotPermission): Promise<BotPermission> {
    const result = await db.insert(schema.botPermissions).values(data).returning();
    return result[0];
  }

  async updateBotPermission(userId: string, permissionLevel: string): Promise<BotPermission> {
    await db.update(schema.botPermissions).set({ permissionLevel }).where(eq(schema.botPermissions.userId, userId));
    const result = await this.getBotPermission(userId);
    if (!result) throw new Error("Permission not found after update");
    return result;
  }

  async deleteBotPermission(userId: string): Promise<void> {
    await db.delete(schema.botPermissions).where(eq(schema.botPermissions.userId, userId));
  }

  async getAllBotPermissions(): Promise<BotPermission[]> {
    return await db.select().from(schema.botPermissions).orderBy(desc(schema.botPermissions.createdAt));
  }

  async getBanProtection(userId: string): Promise<BanProtection | undefined> {
    const result = await db.select().from(schema.banProtections).where(eq(schema.banProtections.userId, userId));
    return result[0];
  }

  async createBanProtection(data: InsertBanProtection): Promise<BanProtection> {
    const result = await db.insert(schema.banProtections).values(data).returning();
    return result[0];
  }

  async deleteBanProtection(userId: string): Promise<void> {
    await db.delete(schema.banProtections).where(eq(schema.banProtections.userId, userId));
  }

  async getAllBanProtections(): Promise<BanProtection[]> {
    return await db.select().from(schema.banProtections).orderBy(desc(schema.banProtections.createdAt));
  }

  // ── Access Change Requests (Network Administrator approval queue) ──────────

  async createAccessChangeRequest(data: {
    requestedBy: string;
    targetUserId: string;
    changes: string;
  }): Promise<AccessChangeRequest> {
    const result = await db.insert(schema.accessChangeRequests).values(data).returning();
    return result[0];
  }

  async getAccessChangeRequest(id: string): Promise<AccessChangeRequest | undefined> {
    const result = await db
      .select()
      .from(schema.accessChangeRequests)
      .where(eq(schema.accessChangeRequests.id, id));
    return result[0];
  }

  async getPendingAccessChangeRequests(): Promise<AccessChangeRequest[]> {
    return await db
      .select()
      .from(schema.accessChangeRequests)
      .where(eq(schema.accessChangeRequests.status, "pending"))
      .orderBy(desc(schema.accessChangeRequests.createdAt));
  }

  async resolveAccessChangeRequest(
    id: string,
    status: "approved" | "rejected",
    reviewedBy: string,
    rejectionReason?: string,
  ): Promise<void> {
    await db
      .update(schema.accessChangeRequests)
      .set({ status, reviewedBy, reviewedAt: new Date(), rejectionReason: rejectionReason ?? null })
      .where(eq(schema.accessChangeRequests.id, id));
  }

  // ── Org Chart Descriptions ──────────────────────────────────────────────

  /**
   * True until the very first clearance is ever assigned to anyone in the
   * whole system. Used purely to bootstrap the clearance system itself —
   * with nothing to check permissions against yet, nobody could otherwise
   * ever grant the first Network Engineer. Once one exists, this closes
   * permanently and normal clearance rules apply to everyone, including
   * whoever used this to bootstrap themselves in.
   */
  async hasAnyAssignedClearance(): Promise<boolean> {
    const rows = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(
        sql`${schema.users.clearance} IS NOT NULL`,
        sql`${schema.users.clearance} != ''`,
        sql`${schema.users.clearance} != 'Member'`,
      ))
      .limit(1);
    return rows.length > 0;
  }

  async getAllOrgChartDescriptions(): Promise<{ key: string; description: string }[]> {
    const rows = await db
      .select({ key: schema.orgChartDescriptions.key, description: schema.orgChartDescriptions.description })
      .from(schema.orgChartDescriptions);
    return rows;
  }

  async upsertOrgChartDescription(key: string, description: string): Promise<void> {
    await db
      .insert(schema.orgChartDescriptions)
      .values({ key, description, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.orgChartDescriptions.key,
        set: { description, updatedAt: new Date() },
      });
  }

  // ── Staff Bios ───────────────────────────────────────────────────────────

  async getStaffBios(robloxUserIds: string[]): Promise<Record<string, string>> {
    if (robloxUserIds.length === 0) return {};
    const rows = await db
      .select({ robloxUserId: schema.staffBios.robloxUserId, bio: schema.staffBios.bio })
      .from(schema.staffBios)
      .where(inArray(schema.staffBios.robloxUserId, robloxUserIds));
    const result: Record<string, string> = {};
    for (const row of rows) result[row.robloxUserId] = row.bio;
    return result;
  }

  async upsertStaffBio(robloxUserId: string, bio: string): Promise<void> {
    await db
      .insert(schema.staffBios)
      .values({ robloxUserId, bio, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.staffBios.robloxUserId,
        set: { bio, updatedAt: new Date() },
      });
  }
}

export const storage = new PostgresStorage();
