export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number; name: string; email: string;
          password_hash: string; role: "admin" | "salesperson"; created_at: string;
          zona: string | null; activation_token: string | null;
        };
        Insert: {
          id?: number; name: string; email: string; password_hash: string;
          role?: "admin" | "salesperson"; created_at?: string;
          zona?: string | null; activation_token?: string | null;
        };
        Update: {
          id?: number; name?: string; email?: string; password_hash?: string;
          role?: "admin" | "salesperson"; created_at?: string;
          zona?: string | null; activation_token?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: number; first_name: string; last_name: string;
          email: string | null; phone: string | null; company: string | null;
          city: string | null; notes: string | null; created_by_id: number | null;
          created_at: string; updated_at: string;
          n8n_managed: boolean; n8n_session_id: string | null;
          pipeline_stage: string | null; lead_score: number | null;
          agente1_interesse: string | null; agente1_sentiment: string | null;
          agente1_bisogno_emergente: string | null; agente2_categoria: string | null;
          agente2_descrizione: string | null; urgenza: string | null;
          disponibilita_economica: string | null; interesse_acquisto: string | null;
          richiede_incentivi: boolean; note_commerciali: string | null;
          appointment_date: string | null; appointment_status: string | null;
          outcome_appuntamento: string | null; motivo_chiusura: string | null;
          prossimo_followup: string | null; wa_contact_id: string | null;
          ultima_interazione: string | null; fonte: string | null; provincia: string | null;
          conversation_summary: string | null;
        };
        Insert: {
          id?: number; first_name: string; last_name: string;
          email?: string | null; phone?: string | null; company?: string | null;
          city?: string | null; notes?: string | null; created_by_id?: number | null;
          created_at?: string; updated_at?: string;
          n8n_managed?: boolean; n8n_session_id?: string | null;
          pipeline_stage?: string | null; lead_score?: number | null;
          agente1_interesse?: string | null; agente1_sentiment?: string | null;
          agente1_bisogno_emergente?: string | null; agente2_categoria?: string | null;
          agente2_descrizione?: string | null; urgenza?: string | null;
          disponibilita_economica?: string | null; interesse_acquisto?: string | null;
          richiede_incentivi?: boolean; note_commerciali?: string | null;
          appointment_date?: string | null; appointment_status?: string | null;
          outcome_appuntamento?: string | null; motivo_chiusura?: string | null;
          prossimo_followup?: string | null; wa_contact_id?: string | null;
          ultima_interazione?: string | null; fonte?: string | null; provincia?: string | null;
          conversation_summary?: string | null;
        };
        Update: {
          id?: number; first_name?: string; last_name?: string;
          email?: string | null; phone?: string | null; company?: string | null;
          city?: string | null; notes?: string | null; created_by_id?: number | null;
          created_at?: string; updated_at?: string;
          n8n_managed?: boolean; n8n_session_id?: string | null;
          pipeline_stage?: string | null; lead_score?: number | null;
          agente1_interesse?: string | null; agente1_sentiment?: string | null;
          agente1_bisogno_emergente?: string | null; agente2_categoria?: string | null;
          agente2_descrizione?: string | null; urgenza?: string | null;
          disponibilita_economica?: string | null; interesse_acquisto?: string | null;
          richiede_incentivi?: boolean; note_commerciali?: string | null;
          appointment_date?: string | null; appointment_status?: string | null;
          outcome_appuntamento?: string | null; motivo_chiusura?: string | null;
          prossimo_followup?: string | null; wa_contact_id?: string | null;
          ultima_interazione?: string | null; fonte?: string | null; provincia?: string | null;
          conversation_summary?: string | null;
        };
        Relationships: [
          { foreignKeyName: "contacts_created_by_id_fkey"; columns: ["created_by_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      sales: {
        Row: {
          id: number; contact_id: number; salesperson_id: number;
          status: "lead" | "prospect" | "trattativa" | "vinto" | "perso";
          product: string | null; value: number | null; notes: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: number; contact_id: number; salesperson_id: number;
          status?: "lead" | "prospect" | "trattativa" | "vinto" | "perso";
          product?: string | null; value?: number | null; notes?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: number; contact_id?: number; salesperson_id?: number;
          status?: "lead" | "prospect" | "trattativa" | "vinto" | "perso";
          product?: string | null; value?: number | null; notes?: string | null;
          created_at?: string; updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "sales_contact_id_fkey"; columns: ["contact_id"]; referencedRelation: "contacts"; referencedColumns: ["id"] },
          { foreignKeyName: "sales_salesperson_id_fkey"; columns: ["salesperson_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      activities: {
        Row: { id: number; sale_id: number; user_id: number; description: string; created_at: string };
        Insert: { id?: number; sale_id: number; user_id: number; description: string; created_at?: string };
        Update: { id?: number; sale_id?: number; user_id?: number; description?: string; created_at?: string };
        Relationships: [
          { foreignKeyName: "activities_sale_id_fkey"; columns: ["sale_id"]; referencedRelation: "sales"; referencedColumns: ["id"] }
        ];
      };
      interactions: {
        Row: {
          id: number; contact_id: number; tipo: string; agente: string | null;
          contenuto: string | null; session_id: string | null;
          prodotti_json: string | null; incentivi_json: string | null; timestamp: string;
        };
        Insert: {
          id?: number; contact_id: number; tipo: string; agente?: string | null;
          contenuto?: string | null; session_id?: string | null;
          prodotti_json?: string | null; incentivi_json?: string | null; timestamp?: string;
        };
        Update: {
          id?: number; contact_id?: number; tipo?: string; agente?: string | null;
          contenuto?: string | null; session_id?: string | null;
          prodotti_json?: string | null; incentivi_json?: string | null; timestamp?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: number; nome: string; categoria: string; prezzo: number | null;
          descrizione: string | null; provincia: string | null; attivo: boolean; created_at: string;
        };
        Insert: {
          id?: number; nome: string; categoria: string; prezzo?: number | null;
          descrizione?: string | null; provincia?: string | null; attivo?: boolean; created_at?: string;
        };
        Update: {
          id?: number; nome?: string; categoria?: string; prezzo?: number | null;
          descrizione?: string | null; provincia?: string | null; attivo?: boolean; created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: number; contact_id: number; salesperson_id: number;
          title: string | null; scheduled_at: string; duration_minutes: number;
          notes: string | null; status: "scheduled" | "completed" | "cancelled";
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: number; contact_id: number; salesperson_id: number;
          title?: string | null; scheduled_at: string; duration_minutes?: number;
          notes?: string | null; status?: "scheduled" | "completed" | "cancelled";
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: number; contact_id?: number; salesperson_id?: number;
          title?: string | null; scheduled_at?: string; duration_minutes?: number;
          notes?: string | null; status?: "scheduled" | "completed" | "cancelled";
          created_at?: string; updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "appointments_contact_id_fkey"; columns: ["contact_id"]; referencedRelation: "contacts"; referencedColumns: ["id"] },
          { foreignKeyName: "appointments_salesperson_id_fkey"; columns: ["salesperson_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      notification_queue: {
        Row: {
          id: number; tipo: string; destinatario: string; oggetto: string | null;
          corpo: string | null; stato: string; created_at: string; sent_at: string | null;
        };
        Insert: {
          id?: number; tipo: string; destinatario: string; oggetto?: string | null;
          corpo?: string | null; stato?: string; created_at?: string; sent_at?: string | null;
        };
        Update: {
          id?: number; tipo?: string; destinatario?: string; oggetto?: string | null;
          corpo?: string | null; stato?: string; created_at?: string; sent_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_leaderboard: {
        Args: { date_from?: string | null };
        Returns: {
          id: number; name: string; vendite_vinte: number; valore_totale: number;
          trattative_totali: number; chiuse: number; tasso_conversione: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
