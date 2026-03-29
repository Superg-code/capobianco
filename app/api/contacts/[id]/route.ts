import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";

type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const id = Number(params.id);

  const { data: contact } = await supabase
    .from("contacts")
    .select("*, creator:users!created_by_id(name)")
    .eq("id", id)
    .maybeSingle();

  if (!contact) return NextResponse.json({ error: "Contatto non trovato" }, { status: 404 });

  const { creator, ...rest } = contact as Record<string, unknown>;
  const flat = { ...rest, created_by_name: (creator as Record<string, unknown> | null)?.name ?? null };

  const { data: sales } = await supabase
    .from("sales")
    .select("*, salesperson:users!salesperson_id(name)")
    .eq("contact_id", id)
    .order("updated_at", { ascending: false });

  const flatSales = (sales ?? []).map((s) => {
    const { salesperson, ...sRest } = s as Record<string, unknown>;
    return { ...sRest, salesperson_name: (salesperson as Record<string, unknown> | null)?.name ?? null };
  });

  return NextResponse.json({ contact: flat, sales: flatSales });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const id = Number(params.id);
  const body = await req.json();

  // Campi UI standard
  const uiFields: Record<string, unknown> = {};
  if (body.first_name !== undefined) uiFields.first_name = body.first_name?.trim() || undefined;
  if (body.last_name  !== undefined) uiFields.last_name  = body.last_name?.trim()  || undefined;
  if (body.email      !== undefined) uiFields.email      = body.email?.trim()      || null;
  if (body.phone      !== undefined) uiFields.phone      = body.phone?.trim()      || null;
  if (body.company    !== undefined) uiFields.company    = body.company?.trim()    || null;
  if (body.city       !== undefined) uiFields.city       = body.city?.trim()       || null;
  if (body.notes      !== undefined) uiFields.notes      = body.notes?.trim()      || null;

  // Campi n8n aggiornabili
  const n8nAllowed = [
    "n8n_session_id", "pipeline_stage", "lead_score",
    "agente1_interesse", "agente1_sentiment", "agente1_bisogno_emergente",
    "agente2_categoria", "agente2_descrizione",
    "urgenza", "disponibilita_economica", "interesse_acquisto",
    "richiede_incentivi", "note_commerciali", "appointment_date",
    "appointment_status", "outcome_appuntamento", "motivo_chiusura",
    "prossimo_followup", "manychat_subscriber_id", "ultima_interazione",
    "fonte", "provincia",
  ] as const;

  const n8nFields: Record<string, unknown> = {};
  for (const key of n8nAllowed) {
    if (key in body) n8nFields[key] = body[key] ?? null;
  }

  const updates: ContactUpdate = { ...uiFields, ...n8nFields, updated_at: new Date().toISOString() };

  await supabase.from("contacts").update(updates).eq("id", id);

  const { data: contact } = await supabase.from("contacts").select("*").eq("id", id).single();
  return NextResponse.json({ contact });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionOrToken(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await supabase.from("contacts").delete().eq("id", Number(params.id));
  return NextResponse.json({ ok: true });
}
