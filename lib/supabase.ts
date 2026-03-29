import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

// Singleton pattern: sopravvive agli hot-reload di Next.js dev
const g = global as unknown as { _supabase: ReturnType<typeof createClient<Database>> };

export const supabase =
  g._supabase ??
  createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

if (process.env.NODE_ENV !== "production") g._supabase = supabase;
