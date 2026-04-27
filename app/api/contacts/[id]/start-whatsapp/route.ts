import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const contactId = Number(params.id);

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, phone, email, company, city, notes, n8n_session_id")
    .eq("id", contactId)
    .maybeSingle();

  if (!contact) return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });
  if (!contact.phone) return NextResponse.json({ error: "Il contatto non ha un numero di telefono" }, { status: 400 });
  if (contact.n8n_session_id) return NextResponse.json({ error: "Conversazione già attiva per questo contatto" }, { status: 409 });

  const conversationSessionId = `conv_${contactId}_${Date.now()}`;
  const n8nBase = process.env.N8N_WEBHOOK_BASE_URL ?? "https://n8n.srv1533428.hstgr.cloud";

  try {
    const res = await fetch(`${n8nBase}/webhook/capobianco/avvia-conversazione`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
        city: contact.city,
        notes: contact.notes,
        conversation_session_id: conversationSessionId,
      }),
    });
    if (!res.ok) throw new Error(`n8n status ${res.status}`);
  } catch (err) {
    console.error("Errore chiamata n8n start-whatsapp:", err);
    return NextResponse.json({ error: "Impossibile avviare la conversazione WhatsApp" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, conversation_session_id: conversationSessionId });
}
