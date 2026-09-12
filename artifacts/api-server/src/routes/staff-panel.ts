import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import {
  insertUserSchema,
  insertModerationLogSchema,
  insertRobloxModerationLogSchema,
  insertDiscordModerationLogSchema,
  updateDiscordModerationLogSchema,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { storage } from "../lib/storage";
import { requireAuth, requireRank, requireClearance, parseClearances } from "../lib/auth-middleware";
import { getRobloxUserInfo, getRobloxAvatar, getRobloxGroupRole } from "../lib/roblox";
import { logger } from "../lib/logger";

const router = Router();

const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID || "";
const ASSIGNABLE_CLEARANCES = ["Staff", "Application Reviewer", "Staff Manager", "Executive", "Network Administrator", "Network Engineer"];

// Attach user to request
router.use(async (req: Request, _res, next) => {
  if (req.session?.userId) {
    const user = await storage.getUser(req.session.userId);
    if (user) req.user = user;
  }
  next();
});

// ── Auth ─────────────────────────────────────────────────────────────────────

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserSchema.parse(req.body);
    if (await storage.getUserByEmail(validatedData.email))
      return res.status(400).json({ error: "Email already registered" });
    if (await storage.getUserByRobloxId(validatedData.robloxUserId))
      return res.status(400).json({ error: "Roblox account already registered" });

    const robloxInfo = await getRobloxUserInfo(validatedData.robloxUserId);
    if (!robloxInfo) return res.status(400).json({ error: "Invalid Roblox User ID" });

    const avatar = await getRobloxAvatar(validatedData.robloxUserId);
    const role = ROBLOX_GROUP_ID ? await getRobloxGroupRole(validatedData.robloxUserId, ROBLOX_GROUP_ID) : { rank: 0, name: "" };
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    // Clearance (Staff / Application Reviewer / Staff Manager / Executive /
    // Network Administrator / Network Engineer) is never auto-assigned —
    // it's granted manually via the Developer Portal, so new users start
    // with none (the "Member" default).

    const user = await storage.createUser({
      ...validatedData,
      robloxUsername: robloxInfo.name,
      robloxAvatar: avatar,
      password: hashedPassword,
      rank: role.rank,
      rankName: role.name,
    });

    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
    const { password, ...safe } = user;
    res.json({ ...safe, sessionToken: req.sessionID });
  } catch (error: any) {
    logger.error({ error }, "Registration error");
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await storage.getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    // Clearance is manually managed (Developer Portal) — login no longer
    // recomputes or overwrites it.
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));

    const updated = await storage.getUser(user.id);
    const { password: pwd, ...safe } = updated!;
    res.json({ ...safe, hasPassword: !!(pwd?.trim().length), sessionToken: req.sessionID });
  } catch (error: any) {
    logger.error({ error }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/login/staff-id", async (req: Request, res: Response) => {
  try {
    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ error: "Staff ID required" });

    let normalizedId = (staffId as string).toUpperCase().trim();
    if (!normalizedId.startsWith("ARC-")) normalizedId = `ARC-${normalizedId}`;

    const user = await storage.getUserByStaffId(normalizedId);
    if (!user) return res.status(401).json({ error: "Invalid Staff ID" });

    // Clearance is manually managed (Developer Portal) — staff-ID login no
    // longer recomputes or overwrites it.
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));

    const updated = await storage.getUser(user.id);
    const { password: pwd, ...safe } = updated!;
    res.json({ ...safe, hasPassword: !!(pwd?.trim().length), sessionToken: req.sessionID });
  } catch (error: any) {
    logger.error({ error }, "Staff ID login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", requireAuth, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { password, ...safe } = req.user;
  res.json({ ...safe, hasPassword: !!(password?.trim().length) });
});

router.patch("/auth/update", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const { discordUsername, discordId, email, password: newPassword } = req.body;

    if (email && email !== req.user.email) {
      const existing = await storage.getUserByEmail(email);
      if (existing && existing.id !== req.user.id) return res.status(400).json({ error: "Email already in use" });
    }

    let hashedPassword: string | undefined;
    if (newPassword?.trim().length >= 6) hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await storage.updateUserInfo(req.user.id, { discordUsername, discordId, email, password: hashedPassword });
    const { password, ...safe } = updated;
    res.json(safe);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update user information" });
  }
});

router.post("/auth/sync-rank", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user || !ROBLOX_GROUP_ID) return res.status(400).json({ error: "Cannot sync rank" });
    const role = await getRobloxGroupRole(req.user.robloxUserId, ROBLOX_GROUP_ID);
    const avatar = await getRobloxAvatar(req.user.robloxUserId);
    const robloxInfo = await getRobloxUserInfo(req.user.robloxUserId);
    if (robloxInfo) {
      await storage.updateUserRank(req.user.id, role.rank, role.name, avatar, robloxInfo.name);
      // Clearance is not touched here — it's managed manually via the
      // Developer Portal, independent of Roblox group rank.
      const updated = await storage.getUser(req.user.id);
      if (updated) { const { password, ...safe } = updated; return res.json(safe); }
    }
    res.status(500).json({ error: "Failed to sync rank" });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync rank" });
  }
});

// ── Staff / Directory ─────────────────────────────────────────────────────────

router.get("/staff", requireAuth, requireRank(8), async (_req, res: Response) => {
  try {
    const staff = await storage.getAllStaff();
    res.json(staff.map(({ password, ...s }) => s));
  } catch { res.status(500).json({ error: "Failed to fetch staff" }); }
});

router.get("/all-staff", requireAuth, requireRank(7), async (_req, res: Response) => {
  try {
    const staff = await storage.getAllStaff();
    res.json(staff.map(({ password, ...s }) => s));
  } catch { res.status(500).json({ error: "Failed to fetch staff" }); }
});

router.get("/leadership", requireAuth, async (_req, res: Response) => {
  try {
    const rankLabel = (rank: number) =>
      rank >= 255 ? "Emperor of Rome" :
      rank >= 254 ? "Princeps Consiliarius" :
      rank >= 253 ? "Staff Pontifex" :
      rank >= 200 ? "Head of Staff" :
      rank >= 199 ? "Deputy Head of Staff" :
      rank >= 150 ? "Senior Administrator" :
      rank >= 100 ? "Administrator" :
      rank >= 99 ? "Senior Moderator" :
      rank >= 98 ? "Moderator" :
      rank >= 97 ? "Trial Moderator" :
      "Member";
    const staff = await storage.getAllStaff();
    const leadership = staff
      .filter((u) => u.rank >= 97)
      .map((u) => ({
        userId: u.id,
        username: u.robloxUsername,
        displayName: u.robloxUsername,
        rank: u.rank,
        roleName: u.rankName || rankLabel(u.rank),
        avatar: u.robloxAvatar,
      }));
    res.json(leadership);
  } catch { res.status(500).json({ error: "Failed to fetch leadership" }); }
});

router.patch("/users/:id", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { discordUsername, discordId, email, rank, rankName, clearance } = req.body;
    const updateData: { discordUsername?: string; discordId?: string; email?: string; rank?: number; rankName?: string; clearance?: string } =
      { discordUsername, discordId, email };

    const wantsAccessChange = rank !== undefined || rankName !== undefined || clearance !== undefined;

    if (wantsAccessChange) {
      // Editing someone's rank/rank name/clearance requires a Network
      // Administrator or Network Engineer clearance — a high numeric rank
      // alone is not enough. Administrators who aren't also an Executive
      // have their change queued for a Network Engineer to approve instead
      // of applying it immediately.
      //
      // Bootstrap exception: nobody starts with any clearance at all, so
      // without this, no one could ever grant the very first Network
      // Engineer. Until literally anyone in the system has any clearance,
      // this check is open — the moment one person is granted clearance,
      // it closes for good and normal rules apply to everyone from then on.
      const bootstrapOpen = !(await storage.hasAnyAssignedClearance());
      const actorClearances = parseClearances(req.user!.clearance);
      const isEngineer = actorClearances.includes("Network Engineer") || bootstrapOpen;
      const isAdmin = actorClearances.includes("Network Administrator");
      const isExecutive = actorClearances.includes("Executive");

      if (!isEngineer && !isAdmin) {
        return res.status(403).json({ error: "You don't have permission to manage user access" });
      }

      const target = await storage.getUser(req.params.id);
      if (!target) return res.status(404).json({ error: "User not found" });

      // Prevent privilege escalation: you can't touch someone at or above
      // your own rank, and you can't grant a rank at or above your own.
      if (target.id !== req.user!.id && target.rank >= req.user!.rank) {
        return res.status(403).json({ error: "You cannot modify the access of a member of equal or higher rank" });
      }
      if (rank !== undefined) {
        if (typeof rank !== "number" || !Number.isFinite(rank) || rank < 0) {
          return res.status(400).json({ error: "Invalid rank" });
        }
        if (rank >= req.user!.rank) {
          return res.status(403).json({ error: "You cannot grant a rank equal to or higher than your own" });
        }
        updateData.rank = rank;
      }
      if (rankName !== undefined) {
        if (typeof rankName !== "string" || rankName.length > 100) {
          return res.status(400).json({ error: "Invalid rank name" });
        }
        updateData.rankName = rankName;
      }
      if (clearance !== undefined) {
        const requested: string[] = Array.isArray(clearance)
          ? clearance
          : String(clearance).split(",").map((c) => c.trim()).filter(Boolean);
        const invalid = requested.filter((c) => !ASSIGNABLE_CLEARANCES.includes(c));
        if (invalid.length > 0) {
          return res.status(400).json({ error: `Unknown clearance value(s): ${invalid.join(", ")}` });
        }
        // Network Engineers can grant any clearance. Everyone else
        // (including Administrators) can only hand out clearance they
        // already hold themselves.
        if (!isEngineer) {
          const notHeld = requested.filter((c) => !actorClearances.includes(c));
          if (notHeld.length > 0) {
            return res.status(403).json({ error: `You cannot grant clearance you don't hold: ${notHeld.join(", ")}` });
          }
        }
        updateData.clearance = requested.length > 0 ? requested.join(",") : "Member";
      }

      // Administrators without Engineer or Executive get queued for approval.
      const requiresApproval = isAdmin && !isEngineer && !isExecutive;
      if (requiresApproval) {
        const request = await storage.createAccessChangeRequest({
          requestedBy: req.user!.id,
          targetUserId: target.id,
          changes: JSON.stringify(updateData),
        });
        logger.info(
          { by: req.user!.robloxUsername, target: target.robloxUsername, requestId: request.id },
          "Access change queued for Network Engineer approval",
        );
        return res.status(202).json({
          pending: true,
          message: "Change submitted for approval by a Network Engineer",
          requestId: request.id,
        });
      }
    }

    const updated = await storage.updateUserInfo(req.params.id, updateData);
    logger.info(
      { target: updated.robloxUsername, by: req.user!.robloxUsername, changedAccess: wantsAccessChange },
      "User info updated",
    );
    const { password, ...safe } = updated;
    res.json(safe);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// ── Access Change Requests (Network Engineer approval queue) ─────────────────

router.get("/access-bootstrap-status", requireAuth, async (_req: Request, res: Response) => {
  try {
    const open = !(await storage.hasAnyAssignedClearance());
    res.json({ open });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/access-requests", requireAuth, requireClearance("Network Engineer"), async (_req, res: Response) => {
  try {
    const pending = await storage.getPendingAccessChangeRequests();
    const withNames = await Promise.all(
      pending.map(async (r) => {
        const [requestedBy, target] = await Promise.all([
          storage.getUser(r.requestedBy),
          storage.getUser(r.targetUserId),
        ]);
        return {
          ...r,
          changes: JSON.parse(r.changes),
          requestedByUsername: requestedBy?.robloxUsername ?? "Unknown",
          targetUsername: target?.robloxUsername ?? "Unknown",
        };
      }),
    );
    res.json(withNames);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post(
  "/access-requests/:id/approve",
  requireAuth,
  requireClearance("Network Engineer"),
  async (req: Request, res: Response) => {
    try {
      const request = await storage.getAccessChangeRequest(req.params.id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "pending") return res.status(400).json({ error: "Request already resolved" });

      const changes = JSON.parse(request.changes);
      const updated = await storage.updateUserInfo(request.targetUserId, changes);
      await storage.resolveAccessChangeRequest(request.id, "approved", req.user!.id);

      logger.info(
        { requestId: request.id, approvedBy: req.user!.robloxUsername, target: updated.robloxUsername },
        "Access change request approved",
      );
      const { password, ...safe } = updated;
      res.json(safe);
    } catch (error: any) { res.status(400).json({ error: error.message }); }
  },
);

router.post(
  "/access-requests/:id/reject",
  requireAuth,
  requireClearance("Network Engineer"),
  async (req: Request, res: Response) => {
    try {
      const request = await storage.getAccessChangeRequest(req.params.id);
      if (!request) return res.status(404).json({ error: "Request not found" });
      if (request.status !== "pending") return res.status(400).json({ error: "Request already resolved" });

      await storage.resolveAccessChangeRequest(request.id, "rejected", req.user!.id, req.body?.reason);
      logger.info(
        { requestId: request.id, rejectedBy: req.user!.robloxUsername },
        "Access change request rejected",
      );
      res.json({ success: true });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
  },
);

router.post("/users/:id/suspend", requireAuth, requireRank(150), async (req: Request, res: Response) => {
  try {
    const target = await storage.getUser(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.id === req.user!.id) return res.status(400).json({ error: "You cannot suspend yourself" });
    if (target.rank >= req.user!.rank) return res.status(403).json({ error: "You cannot suspend a member of equal or higher rank" });
    await db.update(schema.users)
      .set({ suspended: true, suspendedReason: req.body.reason || "No reason provided", suspendedAt: new Date(), suspendedBy: req.user!.robloxUsername })
      .where(eq(schema.users.id, req.params.id));
    logger.info({ target: target.robloxUsername, by: req.user!.robloxUsername }, "Staff suspended");
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/users/:id/unsuspend", requireAuth, requireRank(150), async (req: Request, res: Response) => {
  try {
    await db.update(schema.users)
      .set({ suspended: false, suspendedReason: null, suspendedAt: null, suspendedBy: null })
      .where(eq(schema.users.id, req.params.id));
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/users/:id/reset-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const targetUser = await storage.getUser(req.params.id);
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    if (req.user?.id !== req.params.id && (req.user?.rank ?? 0) < 8)
      return res.status(403).json({ error: "Unauthorized" });
    const tempPassword = Math.random().toString(36).slice(-12).toUpperCase();
    const hashed = await bcrypt.hash(tempPassword, 10);
    await db.update(schema.users).set({ password: hashed }).where(eq(schema.users.id, req.params.id));
    logger.info({ user: targetUser.robloxUsername }, "Password reset");
    res.json({ message: "Password reset successful" });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Moderation Logs ───────────────────────────────────────────────────────────

router.post("/logs", requireAuth, requireRank(140), async (req: Request, res: Response) => {
  try {
    const logData = insertModerationLogSchema.parse({ ...req.body, staffId: req.user!.id });
    const log = await storage.createLog(logData);
    res.json(log);
  } catch (error: any) { res.status(400).json({ error: error.message || "Failed to create log" }); }
});

router.get("/logs", requireAuth, requireRank(140), async (_req, res: Response) => {
  try { res.json(await storage.getAllLogs()); } catch { res.status(500).json({ error: "Failed to fetch logs" }); }
});

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get("/stats", requireAuth, async (_req, res: Response) => {
  try { res.json(await storage.getStats()); } catch { res.status(500).json({ error: "Failed to fetch stats" }); }
});

router.get("/moderation-stats", requireAuth, requireRank(7), async (_req, res: Response) => {
  try {
    const allLogs = await storage.getAllDiscordLogs();
    const robloxLogs = await db.select().from(schema.robloxModerationLogs);
    const discordLogs = allLogs.filter(l => l.platform === "discord");

    const allModCounts = new Map<string, number>();
    const discordModCounts = new Map<string, number>();
    const robloxModCounts = new Map<string, number>();

    discordLogs.forEach(l => {
      discordModCounts.set(l.moderatorName, (discordModCounts.get(l.moderatorName) || 0) + 1);
      allModCounts.set(l.moderatorName, (allModCounts.get(l.moderatorName) || 0) + 1);
    });
    robloxLogs.forEach(l => {
      const n = l.moderatorName || "Unknown";
      robloxModCounts.set(n, (robloxModCounts.get(n) || 0) + 1);
      allModCounts.set(n, (allModCounts.get(n) || 0) + 1);
    });

    const top = (m: Map<string, number>) => {
      const e = Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0];
      return e ? { name: e[0], count: e[1] } : { name: "N/A", count: 0 };
    };

    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const weeklyData = (logs: any[]) => {
      const weeks = [{ week: "4 weeks ago", count: 0 }, { week: "3 weeks ago", count: 0 }, { week: "2 weeks ago", count: 0 }, { week: "This week", count: 0 }];
      logs.forEach(l => {
        const d = new Date(l.createdAt);
        if (d >= fourWeeksAgo) {
          const wi = 3 - Math.min(Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000)), 3);
          if (wi >= 0) weeks[wi].count++;
        }
      });
      return weeks;
    };

    res.json({
      totalRobloxMods: robloxLogs.length,
      totalDiscordMods: discordLogs.length,
      topRobloxModerator: top(robloxModCounts),
      topDiscordModerator: top(discordModCounts),
      topActionTaker: top(allModCounts),
      robloxWeekly: weeklyData(robloxLogs),
      discordWeekly: weeklyData(discordLogs),
    });
  } catch { res.status(500).json({ error: "Failed to fetch moderation statistics" }); }
});

// ── Discord Moderations ───────────────────────────────────────────────────────

router.get("/moderations/discord", requireAuth, async (req: Request, res: Response) => {
  try {
    let logs = await storage.getAllDiscordLogs();
    const { action } = req.query;
    if (action && action !== "all") logs = logs.filter(l => l.action === action);
    res.json(logs.map(log => {
      let evidence = null;
      if (log.details) { try { evidence = JSON.parse(log.details); } catch {} }
      return { id: log.id, platform: "Discord", actionType: log.action, targetId: log.targetId, targetName: log.targetName, moderatorId: log.moderatorId, moderatorName: log.moderatorName, reason: log.reason, evidence, createdAt: log.createdAt.toISOString() };
    }));
  } catch { res.status(500).json({ error: "Failed to fetch moderations" }); }
});

router.post("/moderations/discord", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const v = insertDiscordModerationLogSchema.parse(req.body);
    const moderation = await storage.logDiscordModeration({ platform: v.platform || "discord", action: v.action, moderatorId: v.moderatorId, moderatorName: v.moderatorName, targetId: v.targetId, targetName: v.targetName, reason: v.reason, details: v.details });
    res.json(moderation);
  } catch (error: any) { res.status(400).json({ error: error.message || "Failed to create moderation" }); }
});

router.patch("/moderations/discord/:id", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const v = updateDiscordModerationLogSchema.parse(req.body);
    const updated = await storage.updateDiscordModeration(req.params.id, v);
    res.json(updated);
  } catch (error: any) { res.status(400).json({ error: error.message || "Failed to update moderation" }); }
});

router.delete("/moderations/discord/:id", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    await storage.deleteDiscordModeration(req.params.id);
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message || "Failed to delete moderation" }); }
});

router.get("/discord-bans", requireAuth, async (_req, res: Response) => {
  try { res.json((await storage.getAllDiscordLogs()).filter(l => l.action === "ban")); } catch { res.status(500).json({ error: "Failed to fetch bans" }); }
});

router.get("/discord-moderations", requireAuth, async (_req, res: Response) => {
  try { res.json((await storage.getAllDiscordLogs()).filter(l => l.action !== "ban")); } catch { res.status(500).json({ error: "Failed to fetch moderations" }); }
});

// ── Roblox Moderations ────────────────────────────────────────────────────────

router.get("/moderations/roblox", requireAuth, async (req: Request, res: Response) => {
  try {
    let logs = await storage.getAllRobloxModerations();
    const { action } = req.query;
    if (action && action !== "all") logs = logs.filter(l => l.action === action);
    res.json(logs.map(l => ({ id: l.id, platform: "Roblox", actionType: l.action, targetId: l.targetRobloxId, targetName: l.targetUsername, moderatorId: l.moderatorId || "", moderatorName: l.moderatorName || "System", reason: l.reason, evidence: l.evidence || null, createdAt: l.createdAt.toISOString(), metadata: { warningId: l.warningId, acknowledged: l.acknowledged } })));
  } catch { res.status(500).json({ error: "Failed to fetch moderations" }); }
});

router.post("/moderations/roblox", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { actionType, targetRobloxId, targetRobloxUsername, reason, duration } = req.body;
    if (!actionType || !targetRobloxId || !targetRobloxUsername || !reason)
      return res.status(400).json({ error: "Missing required fields" });
    const warningId = `ROBLOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.insert(schema.robloxModerationLogs).values({ warningId, platform: "roblox", action: actionType, targetRobloxId, targetUsername: targetRobloxUsername, moderatorId: req.user!.robloxUserId, moderatorName: req.user!.robloxUsername, reason, evidence: duration ? JSON.stringify({ duration }) : null, acknowledged: false }).returning();
    res.json(result[0]);
  } catch (error: any) { res.status(400).json({ error: error.message || "Failed to create moderation" }); }
});

router.patch("/moderations/roblox/:id", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { actionType, action, reason, duration, evidence, acknowledged } = req.body;
    const updateData: any = {};
    if (actionType || action) updateData.action = actionType || action;
    if (reason !== undefined) updateData.reason = reason;
    if (duration !== undefined) updateData.evidence = duration ? JSON.stringify({ duration }) : null;
    else if (evidence !== undefined) updateData.evidence = evidence;
    if (acknowledged !== undefined) updateData.acknowledged = acknowledged;
    const result = await db.update(schema.robloxModerationLogs).set(updateData).where(eq(schema.robloxModerationLogs.id, req.params.id)).returning();
    if (!result.length) return res.status(404).json({ error: "Moderation not found" });
    res.json(result[0]);
  } catch (error: any) { res.status(400).json({ error: error.message || "Failed to update moderation" }); }
});

router.delete("/moderations/roblox/:id", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const result = await db.delete(schema.robloxModerationLogs).where(eq(schema.robloxModerationLogs.id, req.params.id)).returning();
    if (!result.length) return res.status(404).json({ error: "Moderation not found" });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message || "Failed to delete moderation" }); }
});

router.get("/roblox-moderations", requireAuth, async (_req, res: Response) => {
  try { res.json(await storage.getAllRobloxModerations()); } catch { res.status(500).json({ error: "Failed to fetch moderations" }); }
});

router.patch("/roblox-moderations/:warningId/acknowledge", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    await storage.updateRobloxModerationAcknowledgment(req.params.warningId, req.body.acknowledged);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to update acknowledgment" }); }
});

// ── User Lookup ───────────────────────────────────────────────────────────────

router.get("/user-lookup/:platform/:userId", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { platform, userId } = req.params;
    if (platform === "discord") return res.json(await storage.getDiscordModerationsByTargetId(userId));
    if (platform === "roblox") return res.json(await storage.getRobloxModerationsByTargetId(userId));
    res.status(400).json({ error: "Invalid platform" });
  } catch { res.status(500).json({ error: "Failed to lookup user" }); }
});

router.get("/user-lookup/roblox/:userId", async (req: Request, res: Response) => {
  try {
    const mods = await db.select().from(schema.robloxModerationLogs).where(eq(schema.robloxModerationLogs.targetRobloxId, req.params.userId)).orderBy(desc(schema.robloxModerationLogs.createdAt));
    res.json(mods);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/user-warnings/:robloxUserId", async (req: Request, res: Response) => {
  try {
    const mods = await db.select().from(schema.robloxModerationLogs).where(eq(schema.robloxModerationLogs.targetRobloxId, req.params.robloxUserId)).orderBy(desc(schema.robloxModerationLogs.createdAt));
    res.json({ warnings: mods.filter(m => m.action !== "ban"), bans: mods.filter(m => m.action === "ban"), total: mods.length });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/moderation-notification/:robloxUserId", async (req: Request, res: Response) => {
  try {
    const mods = await db.select().from(schema.robloxModerationLogs).where(eq(schema.robloxModerationLogs.targetRobloxId, req.params.robloxUserId)).orderBy(desc(schema.robloxModerationLogs.createdAt)).limit(1);
    if (!mods.length) return res.json({ hasNotification: false });
    const mod = mods[0];
    res.json({ hasNotification: true, action: mod.action, reason: mod.reason, moderator: mod.moderatorName, timestamp: mod.createdAt });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Reports ───────────────────────────────────────────────────────────────────

router.get("/staff-list", requireAuth, requireRank(7), async (_req, res: Response) => {
  try {
    const discordLogs = await storage.getAllDiscordLogs();
    const robloxLogs = await db.select().from(schema.robloxModerationLogs);
    const moderatorMap = new Map<string, string>();
    discordLogs.forEach(l => moderatorMap.set(l.moderatorId, l.moderatorName));
    robloxLogs.forEach(l => moderatorMap.set(l.moderatorId, l.moderatorName || "Unknown"));
    res.json(Array.from(moderatorMap.entries()).map(([id, name]) => ({ id, name })));
  } catch { res.status(500).json({ error: "Failed to fetch staff list" }); }
});

router.get("/user-moderations-report/:staffId", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const discordLogs = (await storage.getAllDiscordLogs()).filter(l => l.moderatorId === staffId);
    const robloxLogs = (await db.select().from(schema.robloxModerationLogs)).filter(l => l.moderatorId === staffId);
    const moderatorName = discordLogs[0]?.moderatorName || robloxLogs[0]?.moderatorName || "Unknown";
    const all = [
      ...discordLogs.map(l => ({ id: l.id, platform: "discord", action: l.action, targetId: l.targetId, targetName: l.targetName, reason: l.reason, details: l.details, createdAt: l.createdAt })),
      ...robloxLogs.map(l => ({ id: l.id, platform: "roblox", action: l.action, targetId: l.targetRobloxId, targetName: l.targetUsername, reason: l.reason, evidence: l.evidence, createdAt: l.createdAt })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ moderatorName, moderatorId: staffId, totalModerations: all.length, discordModerations: discordLogs.length, robloxModerations: robloxLogs.length, moderations: all });
  } catch { res.status(500).json({ error: "Failed to fetch report" }); }
});

router.get("/moderator-report", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let discordLogs = await storage.getAllDiscordLogs();
    let robloxLogs = await db.select().from(schema.robloxModerationLogs);
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      discordLogs = discordLogs.filter(l => { const d = new Date(l.createdAt); return d >= start && d <= end; });
      robloxLogs = robloxLogs.filter(l => { const d = new Date(l.createdAt); return d >= start && d <= end; });
    }
    const stats = new Map<string, any>();
    const getOrCreate = (id: string, name: string) => stats.get(id) || stats.set(id, { moderatorId: id, moderatorName: name, totalActions: 0, discordActions: 0, robloxActions: 0, actionBreakdown: { ban: 0, kick: 0, timeout: 0, warning: 0 } }).get(id);
    discordLogs.forEach(l => { const s = getOrCreate(l.moderatorId, l.moderatorName); s.totalActions++; s.discordActions++; (s.actionBreakdown as any)[l.action] = ((s.actionBreakdown as any)[l.action] || 0) + 1; });
    robloxLogs.forEach(l => { const s = getOrCreate(l.moderatorId, l.moderatorName || "Unknown"); s.totalActions++; s.robloxActions++; (s.actionBreakdown as any)[l.action] = ((s.actionBreakdown as any)[l.action] || 0) + 1; });
    res.json(Array.from(stats.values()));
  } catch { res.status(500).json({ error: "Failed to fetch report" }); }
});

router.get("/global-moderation-breakdown", requireAuth, requireRank(7), async (_req, res: Response) => {
  try {
    const discordLogs = await storage.getAllDiscordLogs();
    const robloxLogs = await db.select().from(schema.robloxModerationLogs);
    const ab: any = { ban: 0, kick: 0, timeout: 0, warning: 0 };
    discordLogs.forEach(l => { ab[l.action] = (ab[l.action] || 0) + 1; });
    robloxLogs.forEach(l => { ab[l.action] = (ab[l.action] || 0) + 1; });
    const modCounts = new Map<string, number>();
    discordLogs.forEach(l => modCounts.set(l.moderatorName, (modCounts.get(l.moderatorName) || 0) + 1));
    robloxLogs.forEach(l => { const n = l.moderatorName || "Unknown"; modCounts.set(n, (modCounts.get(n) || 0) + 1); });
    const topModerators = Array.from(modCounts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const last7Days = new Date(); last7Days.setDate(last7Days.getDate() - 7);
    const dailyStats = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), discord: 0, roblox: 0 }; });
    discordLogs.forEach(l => { const d = new Date(l.createdAt); if (d >= last7Days) { const i = 6 - Math.floor((Date.now() - d.getTime()) / 86400000); if (i >= 0 && i < 7) dailyStats[i].discord++; } });
    robloxLogs.forEach(l => { const d = new Date(l.createdAt); if (d >= last7Days) { const i = 6 - Math.floor((Date.now() - d.getTime()) / 86400000); if (i >= 0 && i < 7) dailyStats[i].roblox++; } });
    res.json({ totalModerations: discordLogs.length + robloxLogs.length, discordTotal: discordLogs.length, robloxTotal: robloxLogs.length, actionBreakdown: ab, platformBreakdown: [{ name: "Discord", value: discordLogs.length }, { name: "Roblox", value: robloxLogs.length }], topModerators, dailyStats });
  } catch { res.status(500).json({ error: "Failed to fetch breakdown" }); }
});

router.get("/infraction-report", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;
    let infractions = await db.select().from(schema.staffInfractions).orderBy(desc(schema.staffInfractions.createdAt));
    if (year && month) infractions = infractions.filter(i => { const d = new Date(i.createdAt); return d.getFullYear() === +year && d.getMonth() + 1 === +month; });
    const bySeverity: any = { minor: 0, moderate: 0, severe: 0, critical: 0 };
    infractions.forEach(i => { bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1; });
    res.json({ totalInfractions: infractions.length, byMonth: {}, bySeverity, infractions });
  } catch { res.status(500).json({ error: "Failed to fetch report" }); }
});

// ── Punishments ───────────────────────────────────────────────────────────────

router.get("/punishments", requireAuth, requireRank(7), async (_req, res: Response) => {
  try { res.json(await db.select().from(schema.staffInfractions)); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/punishments/:id", async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(schema.staffInfractions).where(eq(schema.staffInfractions.id, req.params.id));
    if (!result.length) return res.status(404).json({ error: "Punishment not found" });
    res.json(result[0]);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/punishments", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { staffId, type, reason } = req.body;
    const staff = await storage.getUser(staffId);
    if (!staff) return res.status(404).json({ error: "Staff member not found" });
    const result = await db.insert(schema.staffInfractions).values({ staffId, staffName: staff.robloxUsername, staffRobloxId: staff.robloxUserId, infraction: type, reason, issuedBy: req.user!.robloxUsername, severity: type === "strike" ? "high" : type === "warning" ? "medium" : "low" }).returning();
    res.json(result[0]);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete("/punishments/:id", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try { await db.delete(schema.staffInfractions).where(eq(schema.staffInfractions.id, req.params.id)); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Staff of the Month ────────────────────────────────────────────────────────

router.get("/staff-of-the-month", async (_req, res: Response) => {
  try { res.json((await db.select().from(schema.staffOfTheMonth).orderBy(desc(schema.staffOfTheMonth.createdAt)).limit(1))[0] || null); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/staff-of-the-month", requireAuth, requireRank(8), async (req: Request, res: Response) => {
  try {
    const staff = await storage.getUser(req.body.staffId);
    if (!staff) return res.status(404).json({ error: "Staff member not found" });
    await db.delete(schema.staffOfTheMonth);
    const result = await db.insert(schema.staffOfTheMonth).values({ staffId: staff.id, staffName: staff.robloxUsername, staffRobloxId: staff.robloxUserId, staffAvatar: staff.robloxAvatar, setBy: req.user!.id, setByName: req.user!.robloxUsername }).returning();
    res.json(result[0]);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete("/staff-of-the-month", requireAuth, requireRank(8), async (_req, res: Response) => {
  try { await db.delete(schema.staffOfTheMonth); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Staff Policies ────────────────────────────────────────────────────────────

router.get("/staff-policies", async (req: Request, res: Response) => {
  try {
    const policies = await db.select().from(schema.staffPolicies).orderBy(desc(schema.staffPolicies.createdAt));
    if (!req.user) return res.json(policies.map(p => ({ ...p, acknowledged: false })));
    const acknowledged = await db.select().from(schema.policyAcknowledgments).where(eq(schema.policyAcknowledgments.userId, req.user.id));
    const ackIds = new Set(acknowledged.map(a => a.policyId));
    res.json(policies.map(p => ({ ...p, acknowledged: ackIds.has(p.id) })));
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/staff-policies", requireAuth, requireRank(150), async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const result = await db.insert(schema.staffPolicies).values({ title, content, createdBy: req.user!.id, createdByName: req.user!.robloxUsername }).returning();
    res.json(result[0]);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.post("/staff-policies/:id/acknowledge", requireAuth, async (req: Request, res: Response) => {
  try {
    await db.insert(schema.policyAcknowledgments).values({ userId: req.user!.id, policyId: req.params.id, viewDuration: req.body.viewDuration }).onConflictDoNothing();
    res.json({ success: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete("/staff-policies/:id", requireAuth, requireRank(150), async (req: Request, res: Response) => {
  try { await db.delete(schema.staffPolicies).where(eq(schema.staffPolicies.id, req.params.id)); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Staff Quick Links ─────────────────────────────────────────────────────────

router.get("/staff-links", async (_req: Request, res: Response) => {
  try {
    const links = await db.select().from(schema.staffLinks)
      .orderBy(schema.staffLinks.sortOrder, desc(schema.staffLinks.createdAt));
    res.json(links);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/staff-links", requireAuth, requireRank(150), async (req: Request, res: Response) => {
  try {
    const { title, url, icon, sortOrder } = req.body;
    if (!title || !url) return res.status(400).json({ error: "Title and URL are required" });
    const result = await db.insert(schema.staffLinks).values({
      title, url,
      icon: icon || "link",
      sortOrder: sortOrder ?? 0,
      createdBy: req.user!.id,
      createdByName: req.user!.robloxUsername,
    }).returning();
    res.json(result[0]);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete("/staff-links/:id", requireAuth, requireRank(150), async (req: Request, res: Response) => {
  try { await db.delete(schema.staffLinks).where(eq(schema.staffLinks.id, req.params.id)); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Oath of Service ───────────────────────────────────────────────────────────

router.post("/swear-oath", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.update(schema.users)
      .set({ oathSwornAt: new Date() })
      .where(eq(schema.users.id, req.user!.id))
      .returning();
    res.json({ success: true, oathSwornAt: result[0]?.oathSwornAt });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// ── Global Bans & Bot Permissions & Ban Protections ───────────────────────────

router.get("/global-bans", requireAuth, async (_req, res: Response) => {
  try { res.json(await storage.getAllGlobalBans()); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/global-bans", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { userId, username, reason } = req.body;
    const ban = await storage.createGlobalBan({ userId, username, reason, bannedBy: req.user!.robloxUserId, bannedByName: req.user!.robloxUsername });
    res.json(ban);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete("/global-bans/:userId", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try { await storage.deleteGlobalBan(req.params.userId); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/global-ban-check/:userId", async (req: Request, res: Response) => {
  try { res.json(await storage.getGlobalBan(req.params.userId) || null); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/bot-permissions", requireAuth, requireRank(7), async (_req, res: Response) => {
  try { res.json(await storage.getAllBotPermissions()); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/bot-permissions", requireAuth, requireRank(8), async (req: Request, res: Response) => {
  try {
    const { userId, username, permissionLevel } = req.body;
    const perm = await storage.createBotPermission({ userId, username, permissionLevel, grantedBy: req.user!.robloxUserId, grantedByName: req.user!.robloxUsername });
    res.json(perm);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.patch("/bot-permissions/:userId", requireAuth, requireRank(8), async (req: Request, res: Response) => {
  try { res.json(await storage.updateBotPermission(req.params.userId, req.body.permissionLevel)); } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete("/bot-permissions/:userId", requireAuth, requireRank(8), async (req: Request, res: Response) => {
  try { await storage.deleteBotPermission(req.params.userId); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/ban-protections", requireAuth, requireRank(7), async (_req, res: Response) => {
  try { res.json(await storage.getAllBanProtections()); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/ban-protections", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.body;
    const prot = await storage.createBanProtection({ userId, username, protectedBy: req.user!.robloxUserId, protectedByName: req.user!.robloxUsername });
    res.json(prot);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete("/ban-protections/:userId", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try { await storage.deleteBanProtection(req.params.userId); res.json({ success: true }); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/ban-protection-check/:userId", async (req: Request, res: Response) => {
  try { res.json(await storage.getBanProtection(req.params.userId) || null); } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ── Roblox Game API (unauthenticated) ─────────────────────────────────────────

router.post("/issue-ban", async (req: Request, res: Response) => {
  try {
    const { targetUsername, reason, evidence, moderatorId = "system", moderatorName = "System" } = req.body;
    if (!targetUsername || !reason) return res.status(400).json({ error: "Missing required fields" });
    let targetUserId: string | null = null;
    try {
      const r = await fetch("https://users.roblox.com/v1/usernames/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernames: [targetUsername] }) });
      const d = await r.json() as any;
      if (d.data?.[0]) targetUserId = d.data[0].id.toString();
    } catch { targetUserId = targetUsername; }
    if (!targetUserId) return res.status(404).json({ error: "User not found" });
    const warningId = `ban-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(schema.robloxModerationLogs).values({ warningId, platform: "roblox", action: "ban", targetRobloxId: targetUserId, targetUsername, moderatorId, moderatorName, reason, evidence }).returning();
    await db.insert(schema.globalBans).values({ userId: targetUserId, username: targetUsername, reason, bannedBy: moderatorId, bannedByName: moderatorName }).onConflictDoNothing();
    res.json({ success: true, message: "Ban issued successfully" });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/issue-warning", async (req: Request, res: Response) => {
  try {
    const { targetUsername, reason, evidence, warningType, moderatorId = "system", moderatorName = "System" } = req.body;
    if (!targetUsername || !reason) return res.status(400).json({ error: "Missing required fields" });
    let targetUserId: string | null = null;
    try {
      const r = await fetch("https://users.roblox.com/v1/usernames/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernames: [targetUsername] }) });
      const d = await r.json() as any;
      if (d.data?.[0]) targetUserId = d.data[0].id.toString();
    } catch { targetUserId = targetUsername; }
    if (!targetUserId) return res.status(404).json({ error: "User not found" });
    const warningId = `${warningType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(schema.robloxModerationLogs).values({ warningId, platform: "roblox", action: warningType === "kick" ? "kick" : "warning", targetRobloxId: targetUserId, targetUsername, moderatorId, moderatorName, reason, evidence }).returning();
    res.json({ success: true, message: `${warningType} issued successfully` });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

export default router;
