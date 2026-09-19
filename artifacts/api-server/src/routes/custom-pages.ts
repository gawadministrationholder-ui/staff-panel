import { Router, type Request, type Response } from "express";
import { requireAuth, parseClearances } from "../lib/auth-middleware";
import { storage } from "../lib/storage";
import { logger } from "../lib/logger";

const router = Router();

// Only these three pages exist and they can't be created or deleted from
// the UI — the set is fixed in code deliberately so the nav never points at
// a page that doesn't exist.
const PAGES: Record<string, string> = {
  "jedi-order": "The Jedi Order",
  "sith-order": "The Sith Order",
  community: "Community",
};

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

router.get("/pages/:key", async (req: Request, res: Response) => {
  try {
    const title = PAGES[req.params.key];
    if (!title) return res.status(404).json({ error: "Page not found" });

    const page = await storage.getCustomPage(req.params.key);
    let blocks: Block[] = [];
    if (page?.blocks) {
      try {
        blocks = JSON.parse(page.blocks);
      } catch {
        blocks = [];
      }
    }
    res.json({ key: req.params.key, title: page?.title || title, blocks });
  } catch (error: any) {
    logger.error({ error }, "Failed to load custom page");
    res.status(500).json({ error: error.message });
  }
});

router.put("/pages/:key", requireAuth, async (req: Request, res: Response) => {
  try {
    const defaultTitle = PAGES[req.params.key];
    if (!defaultTitle) return res.status(404).json({ error: "Page not found" });

    if (!canEditPages(req)) {
      return res.status(403).json({ error: "You don't have permission to edit pages" });
    }

    const { title, blocks } = req.body;
    if (title !== undefined && (typeof title !== "string" || title.length > 120)) {
      return res.status(400).json({ error: "Invalid title" });
    }

    const sanitized = sanitizeBlocks(blocks);
    await storage.upsertCustomPage(
      req.params.key,
      typeof title === "string" && title.trim() ? title : defaultTitle,
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
