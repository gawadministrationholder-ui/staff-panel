import { Router, type Request, type Response } from "express";
import { requireAuth, parseClearances } from "../lib/auth-middleware";
import { storage } from "../lib/storage";
import { logger } from "../lib/logger";

const router = Router();

function canPost(req: Request): boolean {
  const clearances = parseClearances(req.user!.clearance);
  return (
    clearances.includes("Executive") ||
    clearances.includes("Network Administrator") ||
    clearances.includes("Network Engineer")
  );
}

router.get("/announcements", requireAuth, async (_req: Request, res: Response) => {
  try {
    const announcements = await storage.listAnnouncements(10);
    res.json(announcements);
  } catch (error: any) {
    logger.error({ error }, "Failed to list announcements");
    res.status(500).json({ error: error.message });
  }
});

router.post("/announcements", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canPost(req)) {
      return res.status(403).json({ error: "You don't have permission to post announcements" });
    }
    const { title, content } = req.body;
    if (typeof title !== "string" || !title.trim() || title.length > 150) {
      return res.status(400).json({ error: "Invalid title" });
    }
    if (typeof content !== "string" || !content.trim() || content.length > 2000) {
      return res.status(400).json({ error: "Invalid content" });
    }

    await storage.createAnnouncement(title.trim(), content.trim(), req.user!.robloxUsername, req.user!.id);
    logger.info({ by: req.user!.robloxUsername }, "Announcement posted");
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, "Failed to create announcement");
    res.status(500).json({ error: error.message });
  }
});

router.delete("/announcements/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canPost(req)) {
      return res.status(403).json({ error: "You don't have permission to delete announcements" });
    }
    await storage.deleteAnnouncement(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, "Failed to delete announcement");
    res.status(500).json({ error: error.message });
  }
});

export default router;
