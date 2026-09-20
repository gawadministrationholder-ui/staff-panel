import { Router, type Request, type Response } from "express";
import { requireAuth, parseClearances } from "../lib/auth-middleware";
import { storage } from "../lib/storage";
import { logger } from "../lib/logger";

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

const BLOCK_TYPES = ["heading", "text", "image", "button", "divider"] as const;
type BlockType = (typeof BLOCK_TYPES)[number];

interface Block {
  id: string;
  type: BlockType;
  text?: string;
  url?: string;
  align?: "left" | "center" | "right";
}

function canEditPages(req: Request): boolean {
  const clearances = parseClearances(req.user!.clearance);
  return clearances.includes("Network Engineer") || clearances.includes("Network Administrator");
}

/**
 * Validates and normalizes incoming blocks. Anything unrecognized is
 * dropped rather than stored, so a malformed or hand-crafted request can't
 * persist arbitrary data that the renderer would then have to defend
 * against.
 */
function sanitizeBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) throw new Error("Blocks must be an array");
  if (raw.length > 100) throw new Error("Too many blocks (max 100)");

  return raw.map((item, index) => {
    if (typeof item !== "object" || item === null) throw new Error(`Block ${index} is not an object`);
    const b = item as Record<string, unknown>;

    const type = b.type;
    if (typeof type !== "string" || !BLOCK_TYPES.includes(type as BlockType)) {
      throw new Error(`Block ${index} has an unknown type`);
    }

    const block: Block = {
      id: typeof b.id === "string" && b.id.length <= 64 ? b.id : `block-${index}-${Date.now()}`,
      type: type as BlockType,
    };

    if (typeof b.text === "string") {
      if (b.text.length > 5000) throw new Error(`Block ${index} text is too long (max 5000)`);
      block.text = b.text;
    }

    if (typeof b.url === "string" && b.url.length > 0) {
      if (b.url.length > 2000) throw new Error(`Block ${index} URL is too long`);
      // Only http(s) — blocks javascript: and data: URLs, which would
      // otherwise be a stored-XSS vector once rendered as a link or image.
      if (!/^https?:\/\//i.test(b.url)) {
        throw new Error(`Block ${index} URL must start with http:// or https://`);
      }
      block.url = b.url;
    }

    if (b.align === "left" || b.align === "center" || b.align === "right") {
      block.align = b.align;
    }

    return block;
  });
}

// List every page that currently exists, in the order they were created —
// this is what drives the Pages dropdown in the top bar.
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

    let blocks: Block[] = [];
    if (page.blocks) {
      try {
        blocks = JSON.parse(page.blocks);
      } catch {
        blocks = [];
      }
    }
    res.json({ key: req.params.key, title: page.title, blocks });
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

    const { title, blocks } = req.body;
    if (title !== undefined && (typeof title !== "string" || title.length > 120)) {
      return res.status(400).json({ error: "Invalid title" });
    }

    const sanitized = sanitizeBlocks(blocks);
    await storage.upsertCustomPage(
      req.params.key,
      typeof title === "string" && title.trim() ? title : existingPage.title,
      JSON.stringify(sanitized),
      req.user!.id,
    );

    logger.info({ page: req.params.key, by: req.user!.robloxUsername }, "Custom page updated");
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
