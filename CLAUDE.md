# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build (ESLint disabled, see next.config.mjs)
npm run lint         # ESLint only
npx tsc --noEmit     # Type-check without building
SUPABASE_URL=... SUPABASE_ANON_KEY=... npx tsx scripts/seed.ts  # Seed initial users
```

There are no automated tests. Manual verification is done via `npm run dev`.

## Environment Variables

Required in `.env.local` (never committed):
```
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
JWT_SECRET=<random string, 32+ chars>
CRM_API_TOKEN=<static Bearer token for n8n>
```

## Architecture

### Database
**Supabase (PostgreSQL)** — schema in `scripts/schema.sql`, run once in Supabase SQL Editor.

`lib/supabase.ts` exports a typed singleton `supabase` client (`createClient<Database>`) with a `global._supabase` pattern to survive Next.js hot-reloads. The `Database` type is defined in `types/supabase.ts` with explicit non-circular `Row`/`Insert`/`Update` types per table — required because Supabase's generic inference collapses to `never` without them.

`lib/db.ts` now exports only TypeScript types (`User`, `Contact`, `Sale`, `Activity`) — no database connection.

### Auth
- JWT stored in an **httpOnly cookie** named `crm_token` (8h expiry).
- `lib/auth.ts`: `signToken` / `verifyToken` / `getSession` (server-side, reads `next/headers`).
- `lib/api-auth.ts`: `getSessionOrToken(req)` — checks cookie JWT first, then falls back to `Authorization: Bearer <CRM_API_TOKEN>` for n8n. Returns a synthetic admin payload for the Bearer path.
- `middleware.ts`: Edge Runtime — Bearer token requests to `/api/` are passed through; all other unauthenticated requests redirect to `/login`; non-admins are blocked from `/impostazioni`.

### Route Groups
- `app/(auth)/` — unauthenticated pages (login).
- `app/(dashboard)/` — authenticated pages. `layout.tsx` renders `<Sidebar>` + `<Header>`.
- `app/api/` — Route Handlers. UI routes use `getSession()`; n8n-facing routes use `getSessionOrToken(req)`.

### Data Access Pattern
Server Components query Supabase directly. Client Components fetch via API routes. No shared state library — Server Components pass initial data as props (e.g. `LeaderboardClient`, `SalesKanban`, `UsersManager`).

Nested join results from Supabase (e.g. `contacts(first_name)`, `salesperson:users!salesperson_id(name)`) are flattened inline in each page/route via destructuring:
```ts
const { contacts, salesperson, ...rest } = row as Record<string, unknown>;
```

### Leaderboard RPC
The leaderboard aggregation is too complex for a simple Supabase query — it uses a PostgreSQL function `get_leaderboard(date_from TIMESTAMPTZ)` defined in `scripts/schema.sql` and called via `supabase.rpc("get_leaderboard", { date_from })`.

### Duplicate Detection
`lib/duplicates.ts` — both functions are **async** (Supabase queries):
- `checkSingleDuplicate(email?, phone?)` — real-time form validation via `/api/contacts/check-duplicate`.
- `analyzeImportRows(rows[])` — import preview; detects within-file conflicts via in-memory Maps.

Phone normalization strips Italian prefixes (`+39`, `0039`) before comparison.

### Excel Import Flow (2-phase)
1. `POST /api/contacts/import/preview` — parses `.xlsx` with `lib/excel-parser.ts`, runs `analyzeImportRows`, returns preview JSON (no DB writes).
2. `POST /api/contacts/import/confirm` — bulk-inserts via `supabase.from("contacts").insert(records)`.

### Sales Pipeline
Statuses: `lead` → `prospect` → `trattativa` → `vinto` → `perso`.
`PATCH /api/sales/[id]` logs status changes to the `activities` table automatically.
`SalesKanban.tsx` uses HTML5 drag-and-drop with optimistic UI, reverts on failure.

### Role-Based Access
- `admin`: all contacts and sales, can delete, manages users at `/impostazioni`.
- `salesperson`: all contacts, only their own sales.
- Enforced server-side in every API route (middleware alone is not sufficient).

### n8n Integration
API routes that n8n calls accept `Authorization: Bearer <CRM_API_TOKEN>` via `lib/api-auth.ts`. The Bearer token grants synthetic admin access. Relevant endpoints: `/api/contacts`, `/api/contacts/[id]`, `/api/interactions`, `/api/products/search`, `/api/notifications/email`.

## Branding
Tailwind custom tokens in `tailwind.config.ts`:
- `brand` / `brand-dark` / `brand-light`: yellow `#ffc300` family
- `text` / `text-muted` / `text-light`: dark gray `#333333` family
- `status.*`: per-pipeline-stage colors

Fonts: `font-heading` (Noto Sans), `font-body` (Open Sans) via `next/font/google` in `app/layout.tsx`.
