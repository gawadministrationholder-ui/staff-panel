import { Router, type Request, type Response } from "express";
import { requireAuth } from "../lib/auth-middleware";
import { storage } from "../lib/storage";
import { logger } from "../lib/logger";

const router = Router();

const BOT_OFFLINE_AFTER_MS = 3 * 60 * 1000; // no heartbeat in 3 minutes = offline

router.get("/status", requireAuth, async (_req: Request, res: Response) => {
  const [botLastSeen, robloxOnline] = await Promise.all([
    storage.getBotHeartbeat("discord-bot").catch(() => undefined),
    checkRoblox(),
  ]);

  const botOnline = !!botLastSeen && Date.now() - botLastSeen.getTime() < BOT_OFFLINE_AFTER_MS;

  res.json({
    discordBot: { online: botOnline, lastSeenAt: botLastSeen ?? null },
    roblox: { online: robloxOnline },
  });
});

// Called by the Discord bot itself (a separate project/process) every
// minute or so, just to say "I'm still alive". Protected by a shared
// secret instead of a staff login, since the bot has no user session.
router.post("/bot-heartbeat", async (req: Request, res: Response) => {
  const expected = process.env.BOT_HEARTBEAT_SECRET;
  if (!expected) {
    return res.status(500).json({ error: "BOT_HEARTBEAT_SECRET is not configured on the server" });
  }
  if (req.get("X-Bot-Secret") !== expected) {
    return res.status(401).json({ error: "Invalid or missing secret" });
  }
  try {
    await storage.recordBotHeartbeat("discord-bot");
    res.json({ success: true });
  } catch (error: any) {
    logger.error({ error }, "Failed to record bot heartbeat");
    res.status(500).json({ error: error.message });
  }
});

async function checkRoblox(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const r = await fetch("https://users.roblox.com/v1/users/1", { signal: controller.signal });
    clearTimeout(timeout);
    return r.ok;
  } catch (error) {
    logger.warn({ error }, "Roblox status check failed");
    return false;
  }
}

export default router;
