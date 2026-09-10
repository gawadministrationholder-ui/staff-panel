import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: text("staff_id").unique(),
  robloxUsername: text("roblox_username").notNull(),
  robloxUserId: text("roblox_user_id").notNull().unique(),
  robloxAvatar: text("roblox_avatar").notNull(),
  discordUsername: text("discord_username").notNull(),
  discordId: text("discord_id").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  rank: integer("rank").notNull().default(0),
  rankName: text("rank_name").notNull().default(""),
  clearance: text("clearance").notNull().default("Member"),
  oathSwornAt: timestamp("oath_sworn_at"),
  suspended: boolean("suspended").notNull().default(false),
  suspendedReason: text("suspended_reason"),
  suspendedAt: timestamp("suspended_at"),
  suspendedBy: text("suspended_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  staffId: true,
  robloxAvatar: true,
  rank: true,
  rankName: true,
  clearance: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const moderationLogs = pgTable("moderation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => users.id),
  targetId: text("target_id").notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModerationLogSchema = createInsertSchema(moderationLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;
export type ModerationLog = typeof moderationLogs.$inferSelect;

export const discordModerationLogs = pgTable("discord_moderation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull().default("discord"),
  action: text("action").notNull(),
  moderatorId: text("moderator_id").notNull(),
  moderatorName: text("moderator_name").notNull(),
  targetId: text("target_id").notNull(),
  targetName: text("target_name").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDiscordModerationLogSchema = createInsertSchema(discordModerationLogs).omit({
  id: true,
  createdAt: true,
});

export const updateDiscordModerationLogSchema = z.object({
  action: z.string().trim().min(1, "Action is required"),
  moderatorId: z.string().trim().min(1, "Moderator ID is required"),
  moderatorName: z.string().trim().min(1, "Moderator name is required"),
  targetId: z.string().trim().min(1, "Target ID is required"),
  targetName: z.string().trim().min(1, "Target name is required"),
  reason: z.string().trim().min(1, "Reason is required"),
  details: z.string().optional(),
});

export type InsertDiscordModerationLog = z.infer<typeof insertDiscordModerationLogSchema>;
export type UpdateDiscordModerationLog = z.infer<typeof updateDiscordModerationLogSchema>;
export type DiscordModerationLog = typeof discordModerationLogs.$inferSelect;

export const robloxModerationLogs = pgTable("roblox_moderation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warningId: text("warning_id").notNull().unique(),
  platform: text("platform").notNull().default("roblox"),
  action: text("action").notNull(),
  targetRobloxId: text("target_roblox_id").notNull(),
  targetUsername: text("target_username"),
  moderatorId: text("moderator_id").notNull(),
  moderatorName: text("moderator_name"),
  reason: text("reason").notNull(),
  evidence: text("evidence"),
  acknowledged: boolean("acknowledged").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRobloxModerationLogSchema = createInsertSchema(robloxModerationLogs).omit({
  id: true,
  createdAt: true,
});

export const updateRobloxModerationLogSchema = z.object({
  action: z.string().optional(),
  reason: z.string().optional(),
  evidence: z.string().optional(),
  acknowledged: z.boolean().optional(),
});

export type InsertRobloxModerationLog = z.infer<typeof insertRobloxModerationLogSchema>;
export type UpdateRobloxModerationLog = z.infer<typeof updateRobloxModerationLogSchema>;
export type RobloxModerationLog = typeof robloxModerationLogs.$inferSelect;

export const staffInfractions = pgTable("staff_infractions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull(),
  staffName: text("staff_name").notNull(),
  staffRobloxId: text("staff_roblox_id").notNull(),
  infraction: text("infraction").notNull(),
  reason: text("reason").notNull(),
  issuedBy: text("issued_by").notNull(),
  severity: text("severity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStaffInfractionSchema = createInsertSchema(staffInfractions).omit({
  id: true,
  createdAt: true,
});

export type InsertStaffInfraction = z.infer<typeof insertStaffInfractionSchema>;
export type StaffInfraction = typeof staffInfractions.$inferSelect;

export const globalBans = pgTable("global_bans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  reason: text("reason").notNull(),
  bannedBy: text("banned_by").notNull(),
  bannedByName: text("banned_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGlobalBanSchema = createInsertSchema(globalBans).omit({
  id: true,
  createdAt: true,
});

export type InsertGlobalBan = z.infer<typeof insertGlobalBanSchema>;
export type GlobalBan = typeof globalBans.$inferSelect;

export const botPermissions = pgTable("bot_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  permissionLevel: text("permission_level").notNull(),
  grantedBy: text("granted_by").notNull(),
  grantedByName: text("granted_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBotPermissionSchema = createInsertSchema(botPermissions).omit({
  id: true,
  createdAt: true,
});

export type InsertBotPermission = z.infer<typeof insertBotPermissionSchema>;
export type BotPermission = typeof botPermissions.$inferSelect;

export const staffOfTheMonth = pgTable("staff_of_the_month", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => users.id),
  staffName: text("staff_name").notNull(),
  staffRobloxId: text("staff_roblox_id").notNull(),
  staffAvatar: text("staff_avatar").notNull(),
  setBy: text("set_by").notNull(),
  setByName: text("set_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStaffOfTheMonthSchema = createInsertSchema(staffOfTheMonth).omit({
  id: true,
  createdAt: true,
});

export type InsertStaffOfTheMonth = z.infer<typeof insertStaffOfTheMonthSchema>;
export type StaffOfTheMonth = typeof staffOfTheMonth.$inferSelect;

export const staffPolicies = pgTable("staff_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStaffPolicySchema = createInsertSchema(staffPolicies).omit({
  id: true,
  createdAt: true,
});

export type InsertStaffPolicy = z.infer<typeof insertStaffPolicySchema>;
export type StaffPolicy = typeof staffPolicies.$inferSelect;

export const staffLinks = pgTable("staff_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon").notNull().default("link"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: text("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStaffLinkSchema = createInsertSchema(staffLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertStaffLink = z.infer<typeof insertStaffLinkSchema>;
export type StaffLink = typeof staffLinks.$inferSelect;

export const policyAcknowledgments = pgTable("policy_acknowledgments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  policyId: varchar("policy_id").notNull().references(() => staffPolicies.id),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
  viewDuration: integer("view_duration"),
});

export const insertPolicyAcknowledgmentSchema = createInsertSchema(policyAcknowledgments).omit({
  id: true,
  acceptedAt: true,
});

export type InsertPolicyAcknowledgment = z.infer<typeof insertPolicyAcknowledgmentSchema>;
export type PolicyAcknowledgment = typeof policyAcknowledgments.$inferSelect;

export const banProtections = pgTable("ban_protections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  protectedBy: text("protected_by").notNull(),
  protectedByName: text("protected_by_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBanProtectionSchema = createInsertSchema(banProtections).omit({
  id: true,
  createdAt: true,
});

export type InsertBanProtection = z.infer<typeof insertBanProtectionSchema>;
export type BanProtection = typeof banProtections.$inferSelect;

// Access-change approval queue: when a Network Administrator (without
// Executive) tries to edit someone's rank/rank title/clearance, the change
// is queued here instead of applied immediately, and a Network Engineer
// must approve or reject it.
export const accessChangeRequests = pgTable("access_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").notNull().references(() => users.id),
  changes: text("changes").notNull(), // JSON string: { rank?, rankName?, clearance? }
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccessChangeRequestSchema = createInsertSchema(accessChangeRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
});

export type InsertAccessChangeRequest = z.infer<typeof insertAccessChangeRequestSchema>;
export type AccessChangeRequest = typeof accessChangeRequests.$inferSelect;

// Editable job-description blurb per org chart position. Structure/hierarchy
// of the chart itself is defined in code (see routes/org-chart.ts); only the
// description text is stored here, editable from Staff Management.
export const orgChartDescriptions = pgTable("org_chart_descriptions", {
  key: text("key").primaryKey(),
  description: text("description").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Personal bio per Roblox user, shown in the slide-in panel when their org
// chart card is clicked. Keyed by Roblox user ID (not the site's own user
// id) since many people shown on the chart may not have a site account.
export const staffBios = pgTable("staff_bios", {
  robloxUserId: text("roblox_user_id").primaryKey(),
  bio: text("bio").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
