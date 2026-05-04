import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// Returns contacts eligible for WhatsApp (have phone, no active session)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { data } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, phone")
    .not("phone", "is", null)
    .is("n8n_session_id", null)
    .order("updated_at", { ascending: false });

  return NextResponse.json({ contacts: data ?? [] });
}
