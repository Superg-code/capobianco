import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { to, subject, body: emailBody } = body;

  if (!to || !subject) {
    return NextResponse.json({ error: "to e subject obbligatori" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notification_queue")
    .insert({
      tipo:         "email",
      destinatario: to,
      oggetto:      subject,
      corpo:        emailBody ?? null,
      stato:        "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Notification queue error:", error);
    return NextResponse.json({ error: "Errore durante l'accodamento" }, { status: 500 });
  }

  // TODO: aggiungere invio SMTP reale configurando
  // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in .env.local

  return NextResponse.json({
    ok: true,
    id: data.id,
    sent: false,
    message: "Email accodata correttamente",
  }, { status: 201 });
}
