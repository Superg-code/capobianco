import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const id = Number(params.id);
  const body = await req.json();

  const { data: existing } = await supabase
    .from("appointments")
    .select("salesperson_id, contact_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
  if (session.role !== "admin" && existing.salesperson_id !== Number(session.sub)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title?.trim() || null;
  if (body.scheduled_at) updates.scheduled_at = body.scheduled_at;
  if (body.duration_minutes) updates.duration_minutes = body.duration_minutes;
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
  if (body.status) updates.status = body.status;

  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", id)
    .select("*, contact:contacts(first_name,last_name,company), salesperson:users!salesperson_id(name,zona)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.scheduled_at) {
    await supabase
      .from("contacts")
      .update({ appointment_date: body.scheduled_at, appointment_status: body.status ?? "scheduled" })
      .eq("id", existing.contact_id);
  }

  return NextResponse.json({ appointment: data });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const id = Number(params.id);

  const { data: existing } = await supabase
    .from("appointments")
    .select("salesperson_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (session.role !== "admin" && existing.salesperson_id !== Number(session.sub)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await supabase.from("appointments").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
