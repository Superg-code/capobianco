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

## Deployment

GitHub repo: `https://github.com/Superg-code/capobianco.git` → Vercel auto-deploys on push to `main` → `capobiancocrm.com`.

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

Tables: `users`, `contacts`, `sales`, `activities`, `interactions`, `products`, `notification_queue`, `appointments`.

`lib/db.ts` exports only TypeScript types (`User`, `Contact`, `Sale`, `Activity`, `Appointment`) — no database connection.

### Auth
- JWT stored in an **httpOnly cookie** named `crm_token` (8h expiry).
- `lib/auth.ts`: `signToken` / `verifyToken` / `getSession` (server-side, reads `next/headers`).
- `lib/api-auth.ts`: `getSessionOrToken(req)` — checks cookie JWT first, then falls back to `Authorization: Bearer <CRM_API_TOKEN>` for n8n. Returns a synthetic admin payload for the Bearer path.
- `middleware.ts`: Edge Runtime — Bearer token requests to `/api/` are passed through; all other unauthenticated requests redirect to `/login`; non-admins are blocked from `/impostazioni`. Public paths: `/login`, `/api/auth/login`, `/cancellazione-dati`, `/privacy`, `/attiva-account`, `/api/users/activate`.

### User Invite Flow
Admin creates a salesperson in `/impostazioni` with nome/cognome/zona/email — no password. The API (`POST /api/users`) generates a random `activation_token` (32-byte hex), stores it in `users.activation_token`, and returns the token so the UI can display an activation link. The salesperson visits `/attiva-account?token=<hex>` (public route), which validates the token via `GET /api/users/activate` and lets them set their password via `POST /api/users/activate`. On activation, `activation_token` is cleared from the DB. The `users.zona` field stores the salesperson's geographic zone — used for WhatsApp appointment routing.

### Route Groups
- `app/(auth)/` — unauthenticated pages (login).
- `app/(dashboard)/` — authenticated pages. `layout.tsx` calls `getSession()` server-side and renders `<Sidebar>` + `<Header>` around children.
- `app/api/` — Route Handlers. UI routes use `getSession()`; n8n-facing routes use `getSessionOrToken(req)`.

### Data Access Pattern
Server Components query Supabase directly. Client Components fetch via API routes. No shared state library — Server Components pass initial data as props (e.g., `LeaderboardClient`, `SalesKanban`, `UsersManager`, `CalendarioClient`).

Nested join results from Supabase (e.g., `contact:contacts(first_name,last_name)`, `salesperson:users!salesperson_id(name)`) come back as nested objects and are typed inline in each route.

### Appointments
`/api/appointments` (GET/POST) and `/api/appointments/[id]` (PATCH/DELETE) use `getSessionOrToken` — accessible from both browser and n8n. Salespersons see only their own appointments; admins see all. POST also updates `contacts.appointment_date` and `contacts.appointment_status`. The `/calendario` page is a full monthly calendar with chip-per-day display and a chronological list below the grid.

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
- `salesperson`: all contacts, only their own sales and appointments.
- Enforced server-side in every API route (middleware alone is not sufficient).

### n8n Integration
API routes that n8n calls accept `Authorization: Bearer <CRM_API_TOKEN>` via `lib/api-auth.ts`. The Bearer token grants synthetic admin access. Relevant endpoints: `/api/contacts`, `/api/contacts/[id]`, `/api/interactions`, `/api/products/search`, `/api/notifications/email`.

**WhatsApp conversation start**: `POST /api/contacts/[id]/start-whatsapp` is called by the CRM UI. It validates the contact has a phone and no active session, then POSTs to `{N8N_WEBHOOK_BASE_URL}/webhook/capobianco/avvia-conversazione` with contact data including a generated `conversation_session_id`.

**WhatsApp inbound routing**: `00 WhatsApp Ingresso` receives every inbound WhatsApp message. It extracts `phone` (full E.164 without `+`, e.g. `393883856494`) and `localPhone` (without `39` prefix). It queries Supabase `contacts` with `or=(wa_contact_id.eq.{phone},phone.ilike.*{localPhone})`. If a contact is found, it updates `ultima_interazione` and triggers `01b AI Turn Handler`. If no contact is found, it creates a new one and sets `wa_contact_id`. **Phone format**: `wa_contact_id` must be stored as the full international number without `+` (e.g. `393883856494`). Workflow `01 Avvio Conversazione` sets `wa_contact_id` on the contact immediately after sending the greeting — this is what enables `00 WhatsApp Ingresso` to match the contact when the customer replies.

**01b AI Turn Handler**: runs synchronously (no WAIT node). Loads interaction history from `interactions` table, calls GPT-4o, sends WA reply, then optionally creates an appointment. The `RESPOND_Ack` node fires immediately with `{"started": true}` (responseMode: responseNode) so the caller is not blocked.

`notification_queue` table stores outbound emails queued by `/api/notifications/email`. No SMTP sender is wired up by default.

### Products Search
`GET /api/products/search?categoria=...&provincia=...&budget=...` returns scored product matches. Products are stored in the `products` table.

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
| `00 WhatsApp Verify` (Meta webhook verification) | `kwmlvDjM7MayoD9E` |
| `00 WhatsApp Invio Template` (outbound template sender) | `a5aEt1j7n19EHVc8` |
| `01 Avvio Conversazione da CRM` (CRM UI → greeting → set wa_contact_id → trigger 01b) | `qvRwSaPpXCwDMSqv` |
| `01b AI Turn Handler` (history load, GPT-4o, WA reply, appointment booking) | `q0xmpvyu7PLEIDiS` |

### Workflow 01 Avvio Conversazione node sequence (6 nodes)

```
TRIGGER_CRM_Avvio → HTTP_WA_Greeting (template) → HTTP_Save_Greeting
  → HTTP_Set_WA_Contact_ID (PATCH contacts: wa_contact_id = normalizedPhone)
  → HTTP_Trigger_AI_Turn → SET_Response_OK
```

`HTTP_Set_WA_Contact_ID` normalizes the phone from the CRM format (`+39 388 385 6494`) to E.164 without `+` (`393883856494`) and writes it to `contacts.wa_contact_id`. This is required so that `00 WhatsApp Ingresso` can match the contact when the customer replies.

### Workflow 01b node sequence (17 nodes)

```
TRIGGER_AI_Turn → RESPOND_Ack → HTTP_Save_Inbound → HTTP_Load_History
  → CODE_Build_AI_Prompt → HTTP_OpenAI_Analyze → CODE_Parse_Response
  → CODE_Set_Direct_Reply → HTTP_WA_Send_Reply → HTTP_Save_Outbound
  → IF_Appointment_Requested
      [true]  → HTTP_Get_Salesperson_By_Zone → CODE_Pick_Salesperson
                → HTTP_Create_Appointment → HTTP_Update_Contact_Appointment
                → HTTP_Save_Summary
      [false] → HTTP_Save_Summary
  (IF_End_Conversation is present but disconnected — kept for reference)
```

Key implementation notes:
- `CODE_Build_AI_Prompt` runs `runOnceForAllItems`, uses `$input.all()` to collect full interaction history. Injects today's date so GPT-4o can resolve relative days ("venerdì prossimo") to exact ISO dates. System prompt includes a REGOLE FONDAMENTALI section (no inventing specs/prices) and a split CATALOGO with separate sections for new machines (linking to official NH/JCB portals) and used machines (Agriaffaires link).
- AI response format: natural text first, then `---METADATA---` separator, then JSON metadata. `CODE_Parse_Response` splits on the separator. **Do not re-add `response_format: {type: "json_object"}` to the OpenAI call** — it breaks natural language output.
- `IF_Appointment_Requested` condition: `String($('CODE_Set_Direct_Reply').item.json.appointment_requested) == "true"` (string equality, reads from `CODE_Set_Direct_Reply` explicitly). **Do not use `$json.appointment_requested`** — after `HTTP_Save_Outbound` the Supabase response is empty. **Do not use `boolean.true` / `singleValue` operator** — it silently evaluates false when the value comes from a Code node.
- Appointment zone routing: `HTTP_Get_Salesperson_By_Zone` queries `users?zona=ilike.*{appointment_zone}*`, `CODE_Pick_Salesperson` takes the first match. Falls back to `trigger.salesperson_id` if no zone match found.
- `HTTP_Save_Outbound`, `HTTP_Save_Summary`, and `HTTP_Create_Appointment` all reference `$('CODE_Set_Direct_Reply').item.json.*` explicitly — **not** `$json.*` — because after `HTTP_Save_Outbound` (Supabase 204), `$json` is empty.
- Workflow 00 fetches `created_by_id` from contacts and passes it as `salesperson_id` to 01b.

## Miscellaneous

`capobianco.db` / `capobianco.db-shm` / `capobianco.db-wal` in the project root are leftover SQLite artifacts from early development. Supabase is the only active database — these files are unused.

## Branding
Tailwind custom tokens in `tailwind.config.ts`:
- `brand` / `brand-dark` / `brand-light`: yellow `#ffc300` family
- `text` / `text-muted` / `text-light`: dark gray `#333333` family
- `status.*`: per-pipeline-stage colors (lead=slate, prospect=blue, trattativa=amber, vinto=green, perso=red)

Fonts: `font-heading` (Noto Sans), `font-body` (Open Sans) via `next/font/google` in `app/layout.tsx`.
