// Tipi del database — il client Supabase è in lib/supabase.ts

export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "salesperson";
  created_at: string;
};

export type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  notes: string | null;
  created_by_id: number | null;
  created_at: string;
  updated_at: string;
  // n8n fields
  n8n_managed: boolean;
  n8n_session_id: string | null;
  pipeline_stage: string | null;
  lead_score: number | null;
  agente1_interesse: string | null;
  agente2_categoria: string | null;
  agente2_descrizione: string | null;
  urgenza: string | null;
  disponibilita_economica: string | null;
  interesse_acquisto: string | null;
  richiede_incentivi: boolean;
  note_commerciali: string | null;
  appointment_date: string | null;
  appointment_status: string | null;
  outcome_appuntamento: string | null;
  prossimo_followup: string | null;
  wa_contact_id: string | null;
  ultima_interazione: string | null;
  fonte: string | null;
  provincia: string | null;
  conversation_summary: string | null;
};

export type Sale = {
  id: number;
  contact_id: number;
  salesperson_id: number;
  status: "lead" | "prospect" | "trattativa" | "vinto" | "perso";
  product: string | null;
  value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: number;
  contact_id: number;
  salesperson_id: number;
  title: string | null;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: number;
  sale_id: number;
  user_id: number;
  description: string;
  created_at: string;
};
