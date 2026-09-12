import { Router, type Request, type Response } from "express";
import { requireAuth, requireRank, parseClearances } from "../lib/auth-middleware";
import {
  getRobloxGroupRoles,
  getRobloxGroupRoleMembers,
  getRobloxAvatarsBatch,
  type RobloxGroupMember,
} from "../lib/roblox";
import { storage } from "../lib/storage";
import { logger } from "../lib/logger";

const router = Router();
const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID || "";

// The org chart's shape lives in code — only the description text per
// position is editable (via Staff Management), stored in the DB.
// `robloxRoles` must match the exact role names configured in the Roblox
// group (Group page > Configure > Roles).
interface TierDef {
  key: string;
  label: string;
  subtitle?: string;
  robloxRoles: string[];
}

const OWNER_TIER: TierDef = { key: "owner", label: "Owner", robloxRoles: ["Owner"] };
const COMMUNITY_MANAGER_TIER: TierDef = {
  key: "community_manager",
  label: "Community Manager",
  subtitle: "Head of Staff",
  robloxRoles: ["Community Manager"],
};
const DEPUTY_MANAGER_TIER: TierDef = {
  key: "deputy_manager",
  label: "Deputy Manager",
  subtitle: "Deputy Head of Staff",
  robloxRoles: ["Deputy Manager"],
};
const DEVS_TIER: TierDef = {
  key: "devs",
  label: "Developers",
  robloxRoles: ["Trial Developers", "Developers"],
};
const NETWORK_ADMIN_TIER: TierDef = {
  key: "network_administrator",
  label: "Network Administrator",
  robloxRoles: ["Network Administrator"],
};
// The moderation ladder is a single chain, top to bottom.
const MOD_LADDER_TIERS: TierDef[] = [
  { key: "senior_administrator", label: "Senior Administrator", robloxRoles: ["Senior Administrator"] },
  { key: "administrator", label: "Administrator", robloxRoles: ["Administrator"] },
  { key: "senior_moderator", label: "Senior Moderator", robloxRoles: ["Senior Moderator"] },
  { key: "moderator", label: "Moderator", robloxRoles: ["Moderator"] },
  { key: "trial_moderator", label: "Trial Moderator", robloxRoles: ["Trial Moderator"] },
];

const ALL_TIERS: TierDef[] = [
  OWNER_TIER,
  COMMUNITY_MANAGER_TIER,
  DEPUTY_MANAGER_TIER,
  DEVS_TIER,
  NETWORK_ADMIN_TIER,
  ...MOD_LADDER_TIERS,
];

interface TierResult extends TierDef {
  description: string;
  members: { userId: number; username: string; displayName: string; avatar: string | null; bio: string }[];
}

async function buildOrgChart() {
  if (!ROBLOX_GROUP_ID) {
    throw new Error("ROBLOX_GROUP_ID is not configured");
  }

  const [groupRoles, descriptions] = await Promise.all([
    getRobloxGroupRoles(ROBLOX_GROUP_ID),
    storage.getAllOrgChartDescriptions(),
  ]);
  const descByKey = new Map(descriptions.map((d) => [d.key, d.description]));

  // Fetch members for every distinct Roblox role name referenced anywhere
  // in the chart, then batch-resolve avatars for everyone at once.
  const roleNameToId = new Map(groupRoles.map((r) => [r.name, r.id] as const));
  const membersByRoleName = new Map<string, RobloxGroupMember[]>();
  const allUserIds = new Set<number>();

  await Promise.all(
    ALL_TIERS.flatMap((tier) => tier.robloxRoles).map(async (roleName) => {
      if (membersByRoleName.has(roleName)) return;
      const roleId = roleNameToId.get(roleName);
      if (!roleId) {
        membersByRoleName.set(roleName, []);
        return;
      }
      const members = await getRobloxGroupRoleMembers(ROBLOX_GROUP_ID, roleId);
      membersByRoleName.set(roleName, members);
      for (const m of members) allUserIds.add(m.userId);
    }),
  );

  const [avatars, bios] = await Promise.all([
    getRobloxAvatarsBatch([...allUserIds]),
    storage.getStaffBios([...allUserIds].map(String)),
  ]);

  function resolveTier(tier: TierDef): TierResult {
    const members = tier.robloxRoles
      .flatMap((roleName) => membersByRoleName.get(roleName) ?? [])
      .map((m) => ({ ...m, avatar: avatars[m.userId] ?? null, bio: bios[String(m.userId)] ?? "" }));
    return { ...tier, description: descByKey.get(tier.key) ?? "", members };
  }

  return {
    owners: resolveTier(OWNER_TIER),
    communityManager: resolveTier(COMMUNITY_MANAGER_TIER),
    deputyManager: resolveTier(DEPUTY_MANAGER_TIER),
    branches: {
      devs: resolveTier(DEVS_TIER),
      networkAdministrator: resolveTier(NETWORK_ADMIN_TIER),
      modLadder: MOD_LADDER_TIERS.map(resolveTier),
    },
  };
}

router.get("/org-chart", async (_req: Request, res: Response) => {
  try {
    const chart = await buildOrgChart();
    res.json(chart);
  } catch (error: any) {
    logger.error({ error }, "Failed to build org chart");
    res.status(500).json({ error: error.message ?? "Failed to load org chart" });
  }
});

router.get("/org-chart/tier-keys", requireAuth, (_req: Request, res: Response) => {
  res.json(ALL_TIERS.map((t) => ({ key: t.key, label: t.label })));
});

router.patch("/org-chart/:key", requireAuth, requireRank(7), async (req: Request, res: Response) => {
  try {
    const tier = ALL_TIERS.find((t) => t.key === req.params.key);
    if (!tier) return res.status(404).json({ error: "Unknown org chart position" });

    // Editing job descriptions is a Staff Management action.
    const clearances = parseClearances(req.user!.clearance);
    const canEdit = clearances.includes("Staff Manager") || req.user!.rank >= 150;
    if (!canEdit) return res.status(403).json({ error: "You don't have permission to edit Staff Management content" });

    const { description } = req.body;
    if (typeof description !== "string" || description.length > 500) {
      return res.status(400).json({ error: "Description must be a string under 500 characters" });
    }

    await storage.upsertOrgChartDescription(req.params.key, description);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/org-chart/bio/:robloxUserId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { robloxUserId } = req.params;
    const clearances = parseClearances(req.user!.clearance);
    const isSelf = req.user!.robloxUserId === robloxUserId;
    const canManage = clearances.includes("Staff Manager") || req.user!.rank >= 150;

    if (!isSelf && !canManage) {
      return res.status(403).json({ error: "You can only edit your own bio" });
    }

    const { bio } = req.body;
    if (typeof bio !== "string" || bio.length > 500) {
      return res.status(400).json({ error: "Bio must be a string under 500 characters" });
    }

    await storage.upsertStaffBio(robloxUserId, bio);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
