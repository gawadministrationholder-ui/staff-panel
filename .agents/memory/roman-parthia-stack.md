---
name: Roman Parthia staff panel stack
description: Key technical decisions for the Roman Parthia Remastered staff panel migration
---

# Roman Parthia Remastered — Stack Notes

## Auth
- Session-based auth via `express-session` + `connect-pg-simple` (table: `session`, auto-created)
- `SESSION_SECRET` env var required on startup
- Passwords hashed with `bcrypt`
- `requireAuth` checks `req.session.userId`, user attached to `req.user` via middleware

## Database
- Uses `@workspace/db` which exports `db` (drizzle with node-postgres pool)
- api-server imports `db` directly from `@workspace/db` — no second pool needed
- Schema in `lib/db/src/schema/index.ts`

## Critical: pg package
**Why:** `pg` must be in `dependencies` (not devDependencies) for api-server, because esbuild bundles server code and `pg` is imported in `app.ts` for the session store pool. If missing, build fails with `Could not resolve "pg"`.

## Asset imports
- Original client used `import brandLogo from "@assets/image_1764307589587.png"` — this PNG is NOT in the repo
- Fixed by replacing with `const brandLogo = undefined;` in login.tsx, register.tsx, complete-profile.tsx, moderation-layout.tsx, staff-hub.tsx
- The vite.config.ts has `@assets` aliased to `../../attached_assets/` but no PNG files are there

## Client
- Tailwind 4 (uses `@import "tailwindcss"` syntax, not `@tailwind base/components/utilities`)
- Dark mode forced by `.dark` class on root div — intentional
- Theme vars: background `220 5% 8%`, primary `348 64% 49%`, ring/sidebar-ring is amber `43 88% 56%`
- Font: `Cinzel` for `.font-display` wordmark, `Inter` for body (loaded via Google Fonts or system fallback)
