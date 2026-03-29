-- ============================================================
-- Schema Capobianco CRM — Supabase (PostgreSQL)
-- Esegui questo file nel SQL Editor di Supabase
-- ============================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'salesperson'
                CHECK (role IN ('admin','salesperson')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  id                      BIGSERIAL PRIMARY KEY,
  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  company                 TEXT,
  city                    TEXT,
  notes                   TEXT,
  created_by_id           BIGINT REFERENCES users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- n8n fields
  n8n_managed             BOOLEAN DEFAULT FALSE,
  n8n_session_id          TEXT,
  pipeline_stage          TEXT DEFAULT 'Lead',
  lead_score              INTEGER,
  agente1_interesse       TEXT,
  agente1_sentiment       TEXT,
  agente1_bisogno_emergente TEXT,
  agente2_categoria       TEXT,
  agente2_descrizione     TEXT,
  urgenza                 TEXT,
  disponibilita_economica TEXT,
  interesse_acquisto      TEXT,
  richiede_incentivi      BOOLEAN DEFAULT FALSE,
  note_commerciali        TEXT,
  appointment_date        TIMESTAMPTZ,
  appointment_status      TEXT,
  outcome_appuntamento    TEXT,
  motivo_chiusura         TEXT,
  prossimo_followup       TIMESTAMPTZ,
  manychat_subscriber_id  TEXT,
  ultima_interazione      TIMESTAMPTZ,
  fonte                   TEXT,
  provincia               TEXT
);

-- SALES
CREATE TABLE IF NOT EXISTS sales (
  id             BIGSERIAL PRIMARY KEY,
  contact_id     BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  salesperson_id BIGINT NOT NULL REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'lead'
                 CHECK (status IN ('lead','prospect','trattativa','vinto','perso')),
  product        TEXT,
  value          NUMERIC,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS activities (
  id          BIGSERIAL PRIMARY KEY,
  sale_id     BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INTERACTIONS (n8n)
CREATE TABLE IF NOT EXISTS interactions (
  id             BIGSERIAL PRIMARY KEY,
  contact_id     BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL,
  agente         TEXT,
  contenuto      TEXT,
  session_id     TEXT,
  prodotti_json  TEXT,
  incentivi_json TEXT,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRODUCTS (n8n catalog)
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  nome        TEXT NOT NULL,
  categoria   TEXT NOT NULL,
  prezzo      NUMERIC,
  descrizione TEXT,
  provincia   TEXT,
  attivo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTIFICATION QUEUE (n8n)
CREATE TABLE IF NOT EXISTS notification_queue (
  id           BIGSERIAL PRIMARY KEY,
  tipo         TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  oggetto      TEXT,
  corpo        TEXT,
  stato        TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at      TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_contacts_email    ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone    ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_sales_salesperson ON sales(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_sales_status      ON sales(status);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_products_categoria   ON products(categoria);

-- ============================================================
-- Disabilita RLS (Row Level Security) su tutte le tabelle
-- L'auth è gestita dalla nostra applicazione via JWT
-- ============================================================
ALTER TABLE users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts            DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales               DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities          DISABLE ROW LEVEL SECURITY;
ALTER TABLE interactions        DISABLE ROW LEVEL SECURITY;
ALTER TABLE products            DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue  DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Funzione RPC: Leaderboard venditori
-- ============================================================
CREATE OR REPLACE FUNCTION get_leaderboard(date_from TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
  id               BIGINT,
  name             TEXT,
  vendite_vinte    BIGINT,
  valore_totale    NUMERIC,
  trattative_totali BIGINT,
  chiuse           BIGINT,
  tasso_conversione NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    u.id,
    u.name,
    COUNT(CASE WHEN s.status = 'vinto' THEN 1 END)::BIGINT            AS vendite_vinte,
    COALESCE(SUM(CASE WHEN s.status = 'vinto' THEN s.value END), 0)   AS valore_totale,
    COUNT(s.id)::BIGINT                                                AS trattative_totali,
    COUNT(CASE WHEN s.status IN ('vinto','perso') THEN 1 END)::BIGINT AS chiuse,
    ROUND(
      100.0 * COUNT(CASE WHEN s.status = 'vinto' THEN 1 END)
      / NULLIF(COUNT(CASE WHEN s.status IN ('vinto','perso') THEN 1 END), 0),
      1
    )                                                                  AS tasso_conversione
  FROM users u
  LEFT JOIN sales s
    ON s.salesperson_id = u.id
   AND (date_from IS NULL OR s.updated_at >= date_from)
  WHERE u.role IN ('salesperson','admin')
  GROUP BY u.id, u.name
  ORDER BY vendite_vinte DESC, valore_totale DESC;
$$;
