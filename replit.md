# Roman Parthia Remastered — Staff Panel

A full-stack staff management web app for the Roman Parthia Remastered Roblox group. Manages staff directory, moderation logs, Discord/Roblox moderation records, infractions, global bans, bot permissions, and staff policies.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, mounted at `/api`)
- `pnpm --filter @workspace/staff-panel run dev` — run the staff panel frontend (port 21649, mounted at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

Required env: `DATABASE_URL`, `SESSION_SECRET`
Optional env: `ROBLOX_GROUP_ID` — enables automatic rank sync from Roblox group

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session (pg-backed session store)
- DB: PostgreSQL + Drizzle ORM (`drizzle-orm/node-postgres`)
- Auth: bcrypt password hashing, session-based auth
- Frontend: React + Vite + Tailwind 4 + shadcn/ui components
- Routing: Wouter
- State: TanStack Query

## Where things live

- `lib/db/src/schema/index.ts` — all 12 DB table schemas (source of truth)
- `lib/db/drizzle.config.ts` — Drizzle config (uses DATABASE_URL)
- `artifacts/api-server/src/app.ts` — Express app with session middleware
- `artifacts/api-server/src/routes/staff-panel.ts` — all ~80 API routes
- `artifacts/api-server/src/lib/storage.ts` — PostgresStorage class (DB queries)
- `artifacts/api-server/src/lib/auth-middleware.ts` — requireAuth, requireRank
- `artifacts/api-server/src/lib/roblox.ts` — Roblox API helpers
- `artifacts/api-server/src/lib/rank-sync.ts` — auto rank sync service
- `artifacts/staff-panel/src/App.tsx` — full router + authenticated layout
- `artifacts/staff-panel/src/lib/auth.tsx` — AuthProvider + useAuth hook
- `artifacts/staff-panel/src/pages/` — 25+ page components
- `artifacts/staff-panel/src/components/` — shared UI components + moderation layout

## Architecture decisions

- Session-based auth (not JWT) with connect-pg-simple storing sessions in Postgres
- Rank-gated access: rank 8+ for staff directory, rank 7+ for moderation actions, rank 140+ for Roblox moderation logs
- Staff IDs auto-generated as `ARC-XXXXXX` format on registration
- Dark theme hardcoded via `.dark` class on root `<div>` — this is by design
- brandLogo import replaced with `undefined` since the original PNG is not in the repo (assets not committed)

## Product

Authenticated staff panel for Roman Parthia Remastered admins. Provides:
- Staff directory with Roblox rank sync
- Discord + Roblox moderation log management
- Staff infraction/punishment tracking
- Global ban list and ban protection system
- Bot permission management
- Staff policies with acknowledgment tracking
- Staff of the Month management
- Moderation statistics and reports

## User preferences

_Populate as you build._

## Gotchas

- `pg` must be in `dependencies` (not just devDependencies) for the api-server to resolve it at build time
- The esbuild bundler used by api-server externalizes most packages, but `pg` must be installed as a real dep
- Run `pnpm --filter @workspace/db run push` after any schema changes before restarting the API server
- Rank sync only runs if `ROBLOX_GROUP_ID` env var is set — otherwise skipped silently

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
