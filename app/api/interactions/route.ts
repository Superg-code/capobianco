import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = new URL(req.url);
  const contactId = url.searchParams.get("contact_id");
  if (!contactId) return NextResponse.json({ error: "contact_id obbligatorio" }, { status: 400 });

  const sessionId = url.searchParams.get("session_id");

  let query = supabase
    .from("interactions")
    .select("*")
    .eq("contact_id", Number(contactId));

  if (sessionId) query = query.eq("session_id", sessionId);

  const { data: interactions } = await query.order("timestamp", { ascending: true });

  return NextResponse.json({ interactions: interactions ?? [] });
}

export async function POST(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { contact_id, tipo, agente, contenuto, session_id, prodotti_json, incentivi_json, timestamp } = body;

  if (!contact_id || !tipo) {
    return NextResponse.json({ error: "contact_id e tipo sono obbligatori" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("interactions")
    .insert({
      contact_id:     Number(contact_id),
      tipo,
      agente:         agente         ?? null,
      contenuto:      contenuto      ?? null,
      session_id:     session_id     ?? null,
      prodotti_json:  prodotti_json  ?? null,
      incentivi_json: incentivi_json ?? null,
      timestamp:      timestamp      ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Interactions POST error:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, ok: true }, { status: 201 });
}
