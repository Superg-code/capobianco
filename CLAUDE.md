# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (defaults to :3000, falls back to :3001 if in use)
npm run build        # Production build + type-check + lint
npm run lint         # ESLint only
npm run db:seed      # Create initial users in capobianco.db (run once on first setup)
npx tsc --noEmit     # Type-check without building
```

There are no automated tests. Manual verification is done by running `npm run dev` and exercising the UI.

## Architecture

### Database
`lib/db.ts` exports a **singleton** `db` instance (pattern required to survive Next.js hot-reloads). The SQLite file `capobianco.db` is created at the project root on first run. Schema is initialized inline via `db.exec(...)` — no migration system. All dates are stored as ISO strings (`datetime('now')`).

`better-sqlite3` is a native Node addon and **cannot be imported in Edge Runtime** files (i.e. `middleware.ts`). It is excluded from webpack via `serverComponentsExternalPackages` in `next.config.mjs`.

### Auth
- JWT stored in an **httpOnly cookie** named `crm_token` (8h expiry).
- `lib/auth.ts`: `signToken` / `verifyToken` / `getSession` (server-side, uses `next/headers`).
- `middleware.ts`: runs on Edge Runtime — uses `jose` directly (no `lib/db.ts` import allowed here). Redirects unauthenticated requests to `/login`; blocks non-admins from `/impostazioni`.
- API routes and Server Components call `getSession()` independently — never trust client-side role claims.

### Route Groups
- `app/(auth)/` — unauthenticated pages (login). No shared layout.
- `app/(dashboard)/` — all authenticated pages. `layout.tsx` calls `getSession()` and renders `<Sidebar>` + `<Header>`.
- `app/api/` — all Route Handlers. Every handler calls `getSession()` and returns 401/403 as needed.

### Data Access Pattern
Server Components (pages) query SQLite directly via `lib/db.ts`. Client Components fetch data via the API routes. There is no shared state management library — Server Components pass initial data as props to Client Components (e.g. `LeaderboardClient`, `SalesKanban`, `UsersManager`).

### Duplicate Detection
`lib/duplicates.ts` exports:
- `checkSingleDuplicate(email?, phone?)` — used by the API route `/api/contacts/check-duplicate` for real-time form validation.
- `analyzeImportRows(rows[])` — used during Excel import preview; also detects within-file conflicts via in-memory Maps.

Phone normalization strips Italian prefixes (`+39`, `0039`) and formatting characters before comparison.

### Excel Import Flow (2-phase)
1. `POST /api/contacts/import/preview` — parses the `.xlsx` buffer with `lib/excel-parser.ts`, runs `analyzeImportRows`, returns preview JSON (no DB writes).
2. `POST /api/contacts/import/confirm` — receives the rows array with user-adjusted `action` fields, bulk-inserts in a single SQLite transaction.

`lib/excel-parser.ts` maps Italian/English column header variants to `ImportRow` fields (see `COLUMN_MAP`).

### Sales Pipeline
Statuses (in order): `lead` → `prospect` → `trattativa` → `vinto` → `perso`.
Status changes via `PATCH /api/sales/[id]` automatically insert an entry in the `activities` table.
`SalesKanban.tsx` uses native HTML5 drag-and-drop with optimistic UI — reverts on API failure.

### Role-Based Access
- `admin`: sees all contacts and sales, can delete, manages users at `/impostazioni`.
- `salesperson`: sees all contacts, only their own sales.
- Role filtering in API routes is enforced server-side in addition to middleware.

## Branding
Brand colors are defined in `tailwind.config.ts`:
- `brand` / `brand-dark` / `brand-light`: yellow `#ffc300` family
- `text` / `text-muted` / `text-light`: dark gray `#333333` family
- `status.*`: per-pipeline-stage colors

Font classes: `font-heading` (Noto Sans), `font-body` (Open Sans) — loaded via `next/font/google` in `app/layout.tsx`.
