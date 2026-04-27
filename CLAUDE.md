# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build (ESLint disabled, see next.config.mjs)
npm run lint         # ESLint only
npx tsc --noEmit     # Type-check without building
npm run db:seed      # Create initial users (run once after schema.sql)
```

There are no automated tests. Manual verification is done via `npm run dev`.

## Environment Variables

Required in `.env.local` (never committed):
```
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
JWT_SECRET=<random string, 32+ chars>
CRM_API_TOKEN=<static Bearer token for n8n>
N8N_WEBHOOK_BASE_URL=https://n8n.srv1533428.hstgr.cloud  # used by start-whatsapp route

# WhatsApp Business API (Meta)
WHATSAPP_ACCESS_TOKEN=<permanent System User token>
WHATSAPP_PHONE_NUMBER_ID=<phone number ID>
WHATSAPP_BUSINESS_ACCOUNT_ID=<account ID>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<string for Meta webhook verification>
```

> **Note**: n8n's `$env.*` access is blocked on the hosted instance. All n8n workflows call **Supabase REST API directly** (not CRM API routes) for DB operations. CRM API routes are only called from the browser UI.

## Architecture

### Database
**Supabase (PostgreSQL)** — schema in `scripts/schema.sql`, run once in Supabase SQL Editor.

`lib/supabase.ts` exports a typed singleton `supabase` client (`createClient<Database>`) with a `global._supabase` pattern to survive Next.js hot-reloads. The `Database` type is in `types/supabase.ts` with explicit non-circular `Row`/`Insert`/`Update` types per table — required because Supabase's generic inference collapses to `never` without them.

Tables: `users`, `contacts`, `sales`, `activities`, `interactions`, `products`, `notification_queue`.

`lib/db.ts` exports only TypeScript types (`User`, `Contact`, `Sale`, `Activity`) — no database connection.

### Auth
- JWT stored in an **httpOnly cookie** named `crm_token` (8h expiry).
- `lib/auth.ts`: `signToken` / `verifyToken` / `getSession` (server-side, reads `next/headers`).
- `lib/api-auth.ts`: `getSessionOrToken(req)` — checks cookie JWT first, then falls back to `Authorization: Bearer <CRM_API_TOKEN>` for n8n. Returns a synthetic admin payload for the Bearer path.
- `middleware.ts`: Edge Runtime — Bearer token requests to `/api/` are passed through; all other unauthenticated requests redirect to `/login`; non-admins are blocked from `/impostazioni`. Public paths (no auth required): `/login`, `/api/auth/login`, `/cancellazione-dati`, `/privacy`.

### Route Groups
- `app/(auth)/` — unauthenticated pages (login).
- `app/(dashboard)/` — authenticated pages. `layout.tsx` calls `getSession()` server-side and renders `<Sidebar>` + `<Header>` around children.
- `app/api/` — Route Handlers. UI routes use `getSession()`; n8n-facing routes use `getSessionOrToken(req)`.

### Data Access Pattern
Server Components query Supabase directly. Client Components fetch via API routes. No shared state library — Server Components pass initial data as props (e.g., `LeaderboardClient`, `SalesKanban`, `UsersManager`).

Nested join results from Supabase (e.g., `contacts(first_name)`, `salesperson:users!salesperson_id(name)`) are flattened inline in each page/route via destructuring:
```ts
const { contacts, salesperson, ...rest } = row as Record<string, unknown>;
```

### Leaderboard RPC
The leaderboard uses a PostgreSQL function `get_leaderboard(date_from TIMESTAMPTZ)` in `scripts/schema.sql`, called via `supabase.rpc("get_leaderboard", { date_from })`. The `GET /api/leaderboard` route accepts `?period=all|month|quarter|year` and calculates `date_from` accordingly.

### Duplicate Detection
`lib/duplicates.ts` — both functions are **async** (Supabase queries):
- `checkSingleDuplicate(email?, phone?)` — real-time form validation via `GET /api/contacts/check-duplicate`.
- `analyzeImportRows(rows[])` — import preview; detects DB conflicts and within-file conflicts via in-memory Maps.

`normalizePhone(phone)` strips Italian prefixes (`+39`, `0039`) and leading zeros before comparison.

### Excel Import Flow (2-phase)
1. `POST /api/contacts/import/preview` — parses `.xlsx` with `lib/excel-parser.ts`, runs `analyzeImportRows`, returns preview JSON (no DB writes). Column headers are detected flexibly (Italian and English aliases via `COLUMN_MAP`).
2. `POST /api/contacts/import/confirm` — bulk-inserts via `supabase.from("contacts").insert(records)`.

### Sales Pipeline
Statuses: `lead` → `prospect` → `trattativa` → `vinto` → `perso`.
`PATCH /api/sales/[id]` logs status changes to the `activities` table automatically.
`SalesKanban.tsx` uses HTML5 drag-and-drop with **optimistic UI** — local state updates immediately, reverts on API failure.

### Role-Based Access
- `admin`: all contacts and sales, can delete, manages users at `/impostazioni`.
- `salesperson`: all contacts, only their own sales.
- Enforced server-side in every API route (middleware alone is not sufficient).

### n8n Integration
API routes that n8n calls accept `Authorization: Bearer <CRM_API_TOKEN>` via `lib/api-auth.ts`. The Bearer token grants synthetic admin access. Relevant endpoints: `/api/contacts`, `/api/contacts/[id]`, `/api/interactions`, `/api/products/search`, `/api/notifications/email`.

**WhatsApp conversation start**: `POST /api/contacts/[id]/start-whatsapp` is called by the CRM UI. It validates the contact has a phone and no active session, then POSTs to `{N8N_WEBHOOK_BASE_URL}/webhook/capobianco/avvia-conversazione` with contact data including a generated `conversation_session_id`.

**Session-based routing for WhatsApp agents**: workflow `01b AI Turn Handler` uses a WAIT node with `resume: "webhook"`. Before suspending, `HTTP_Save_Session` PATCHes `contacts.n8n_session_id = $execution.resumeUrl` via Supabase REST. The trigger has `responseMode: "responseNode"` and a `RESPOND_Ack` node fires before the WAIT — this means the caller gets an immediate `{"started": true}` response while 01b continues in background as a "waiting" execution. When a customer reply arrives, `00 WhatsApp Ingresso` checks `n8n_session_id` — if set, POSTs to the resumeUrl (resuming 01b); if empty, triggers 01b fresh as a new session. After WAIT resumes, `HTTP_Clear_Session` sets `n8n_session_id` to null.

`notification_queue` table stores outbound emails queued by `/api/notifications/email`. No SMTP sender is wired up by default — configure `SMTP_*` variables in `.env.local` to enable sending.

### Products Search
`GET /api/products/search?categoria=...&provincia=...&budget=...` returns scored product matches. Products are stored in the `products` table (seeded separately from `scripts/schema.sql`).

## Dashboard pages

| Route | Description |
|---|---|
| `/dashboard` | Stats overview (Server Component) |
| `/contatti` | Contact list + Excel import (Server + `ContactForm` client) |
| `/vendite` | Sales Kanban (`SalesKanban` client, drag-and-drop) |
| `/classifica` | Leaderboard (`LeaderboardClient`, calls `get_leaderboard` RPC) |
| `/impostazioni` | Admin-only user management (`UsersManager` client) |
| `/calendario` | Monthly calendar for appointments (`CalendarioClient`) |

## n8n Workflow IDs

| Workflow | ID |
|---|---|
| `00 WhatsApp Ingresso` (inbound webhook, contact lookup, triggers 01b) | `0Y24BgIZQwpJE3br` |
| `01b AI Turn Handler` (history load, GPT-4o, WA reply) | `q0xmpvyu7PLEIDiS` |

`HTTP_Load_History` in 01b queries `interactions` filtered by `contact_id` + `session_id` (not just contact_id). The `CODE_Build_AI_Prompt` node runs `runOnceForAllItems` and uses `$input.all()` to collect the full history; the last inbound row (just saved) is popped from the array before appending the current `message_text` at the end.

## Miscellaneous

`capobianco.db` / `capobianco.db-shm` / `capobianco.db-wal` in the project root are leftover SQLite artifacts from early development. Supabase is the only active database — these files are unused.

## Branding
Tailwind custom tokens in `tailwind.config.ts`:
- `brand` / `brand-dark` / `brand-light`: yellow `#ffc300` family
- `text` / `text-muted` / `text-light`: dark gray `#333333` family
- `status.*`: per-pipeline-stage colors (lead=slate, prospect=blue, trattativa=amber, vinto=green, perso=red)

Fonts: `font-heading` (Noto Sans), `font-body` (Open Sans) via `next/font/google` in `app/layout.tsx`.
