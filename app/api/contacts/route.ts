import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = new URL(req.url);

  // Ricerca duplicati per n8n: ?email=...&telefono=...
  const emailExact = url.searchParams.get("email");
  const telefonoExact = url.searchParams.get("telefono");

  if (emailExact || telefonoExact) {
    let query = supabase.from("contacts").select("id, pipeline_stage");
    if (emailExact) query = query.ilike("email", emailExact);
    if (telefonoExact) query = query.eq("phone", telefonoExact);
    const { data } = await query.maybeSingle();
    if (data) return NextResponse.json({ exists: true, contact_id: data.id, stato: data.pipeline_stage });
    return NextResponse.json({ exists: false });
  }

  // Filtro per stage/outcome (Agente 4)
  const pipelineStage = url.searchParams.get("pipeline_stage");
  const outcomeAppuntamento = url.searchParams.get("outcome_appuntamento");
  if (pipelineStage || outcomeAppuntamento) {
    let query = supabase.from("contacts").select("*").order("updated_at", { ascending: false });
    if (pipelineStage) query = query.eq("pipeline_stage", pipelineStage);
    if (outcomeAppuntamento) query = query.eq("outcome_appuntamento", outcomeAppuntamento);
    const { data } = await query;
    return NextResponse.json({ contacts: data ?? [] });
  }

  // Lista standard per la UI (con paginazione e ricerca)
  const q = url.searchParams.get("q") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("contacts")
    .select("*, creator:users!created_by_id(name)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,company.ilike.%${q}%,city.ilike.%${q}%`
    );
  }

  const { data, count } = await query;

  // Appiattisce il campo creator per compatibilità con la UI esistente
  const contacts = (data ?? []).map((c) => {
    const { creator, ...rest } = c as Record<string, unknown>;
    return { ...rest, created_by_name: (creator as Record<string, unknown> | null)?.name ?? null };
  });

  return NextResponse.json({ contacts, total: count ?? 0, page, limit });
}

export async function POST(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();

  const first_name = (body.first_name ?? body.nome ?? "").trim();
  const last_name  = (body.last_name  ?? body.cognome ?? "").trim();
  const email      = body.email?.trim() || null;
  const phone      = (body.phone ?? body.telefono)?.trim() || null;
  const company    = (body.company ?? body.azienda)?.trim() || null;
  const city       = (body.city ?? body.provincia)?.trim() || null;
  const notes      = (body.notes ?? body.note)?.trim() || null;

  if (!first_name && !last_name) {
    return NextResponse.json({ error: "Nome o cognome obbligatorio" }, { status: 400 });
  }

  const { data: contact } = await supabase
    .from("contacts")
    .insert({
      first_name,
      last_name,
      email,
      phone,
      company,
      city,
      notes,
      created_by_id: session.sub !== "0" ? Number(session.sub) : null,
      n8n_managed:   body.n8n_managed ?? false,
      pipeline_stage: body.pipeline_stage ?? body.stato ?? "Lead",
      fonte:     body.fonte ?? null,
      provincia: body.provincia ?? null,
      ultima_interazione: new Date().toISOString(),
    })
    .select()
    .single();

  return NextResponse.json({ contact, contact_id: contact?.id }, { status: 201 });
}
