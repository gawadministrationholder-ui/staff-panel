import type { Request, Response, NextFunction } from "express";
import type { User } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function requireRank(minRank: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.suspended) {
      return res.status(403).json({ error: "Your staff access is currently suspended" });
    }
    if (req.user.rank < minRank) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

/** Parses a user's clearance column (comma-separated) into a clean list. */
export function parseClearances(clearance: string | null | undefined): string[] {
  return (clearance ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Gates routes behind a named clearance (e.g. "Management") rather than a
 * numeric rank. This is the permission that controls who can grant or
 * revoke *other people's* access (rank, rank name, clearance) — kept
 * separate from `requireRank` so that raising someone's rank doesn't, by
 * itself, ever let them start editing everyone else's access.
 */
export function requireClearance(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.suspended) {
      return res.status(403).json({ error: "Your staff access is currently suspended" });
    }
    const userClearances = parseClearances(req.user.clearance);
    const hasClearance = allowed.some((c) => userClearances.includes(c));
    if (!hasClearance) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
