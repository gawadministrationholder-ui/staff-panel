---
name: Rank-gated routes
description: Access control rules for Roman Parthia Remastered API routes
---

# API Route Rank Requirements

| Route | Min Rank | Notes |
|-------|---------|-------|
| GET /api/staff | 8 | Full staff directory |
| GET /api/all-staff | 7 | Staff list for dropdowns |
| Moderation CRUD (discord/roblox) | 7 | Create/update/delete mod records |
| Global bans CRUD | 7 | Create/delete global bans |
| Bot permissions (write) | 8 | Grant/revoke bot perms |
| Staff policies (write) | 8 | Create/delete policies |
| Staff of the month (write) | 8 | Set/remove SOTM |
| POST /api/logs | 140 | Roblox group moderator rank |
| GET /api/stats | any auth | Stats visible to all staff |
| GET /api/moderation-stats | 7 | Moderation statistics |

**Why:** Rank system mirrors Roblox group roles. Rank 140 = group moderator. Rank 7-8 = web panel management. Rank 8+ = administrative access.

**How to apply:** Use `requireRank(N)` middleware from `lib/auth-middleware.ts` after `requireAuth`.
