import { Router, type Request, type Response } from "express";
import { requireAuth, parseClearances } from "../lib/auth-middleware";
import { storage } from "../lib/storage";
import { logger } from "../lib/logger";
import { sanitizeHtml } from "../lib/html-sanitize";

const router = Router();

/** lowercase-hyphen slug from a title, e.g. "The Jedi Order" -> "the-jedi-order". */
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "page";
}

function canEditPages(req: Request): boolean {
  const clearances = parseClearances(req.user!.clearance);
  return clearances.includes("Network Engineer") || clearances.includes("Network Administrator");
}

// List every page that currently exists, grouped by category — this is
// what drives the per-category dropdowns in the top bar.
router.get("/pages", requireAuth, async (_req: Request, res: Response) => {
  try {
    const pages = await storage.listCustomPages();
    res.json(pages);
  } catch (error: any) {
    logger.error({ error }, "Failed to list custom pages");
    res.status(500).json({ error: error.message });
  }
});

router.post("/pages", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditPages(req)) {
      return res.status(403).json({ error: "You don't have permission to add pages" });
    }
    const { title, category } = req.body;
    if (typeof title !== "string" || !title.trim() || title.length > 120) {
      return res.status(400).json({ error: "Invalid title" });
    }
    const cleanCategory =
      typeof category === "string" && category.trim() && category.length <= 60 ? category.trim() : "General";

    const existing = await storage.listCustomPages();
    const taken = new Set(existing.map((p) => p.key));
    let key = slugify(title);
    let suffix = 2;
    while (taken.has(key)) {
      key = `${slugify(title)}-${suffix}`;
      suffix++;
    }

    await storage.createCustomPage(key, title.trim(), cleanCategory, req.user!.id);
    logger.info({ page: key, category: cleanCategory, by: req.user!.robloxUsername }, "Custom page created");
    res.json({ key, title: title.trim(), category: cleanCategory });
  } catch (error: any) {
    logger.error({ error }, "Failed to create custom page");
    res.status(500).json({ error: error.message });
  }
});

router.delete("/pages/:key", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditPages(req)) {
      return res.status(403).json({ error: "You don't have permission to delete pages" });
    }
    await storage.deleteCustomPage(req.params.key);
    logger.info({ page: req.params.key, by: req.user!.robloxUsername }, "Custom page deleted");
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, "Failed to delete custom page");
    res.status(500).json({ error: error.message });
  }
});

router.get("/pages/:key", async (req: Request, res: Response) => {
  try {
    const page = await storage.getCustomPage(req.params.key);
    if (!page) return res.status(404).json({ error: "Page not found" });
    res.json({ key: req.params.key, title: page.title, html: page.blocks || "" });
  } catch (error: any) {
    logger.error({ error }, "Failed to load custom page");
    res.status(500).json({ error: error.message });
  }
});

router.put("/pages/:key", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditPages(req)) {
      return res.status(403).json({ error: "You don't have permission to edit pages" });
    }

    const existingPage = await storage.getCustomPage(req.params.key);
    if (!existingPage) return res.status(404).json({ error: "Page not found — create it first" });

    const { title, html } = req.body;
    if (title !== undefined && (typeof title !== "string" || title.length > 120)) {
      return res.status(400).json({ error: "Invalid title" });
    }

    const cleanHtml = sanitizeHtml(html);
    await storage.upsertCustomPage(
      req.params.key,
      typeof title === "string" && title.trim() ? title : existingPage.title,
      cleanHtml,
      req.user!.id,
    );

    logger.info({ page: req.params.key, by: req.user!.robloxUsername }, "Custom page updated");
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
