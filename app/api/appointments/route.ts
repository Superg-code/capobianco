import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // YYYY-MM
  const salespersonId = url.searchParams.get("salesperson_id");

  let query = supabase
    .from("appointments")
    .select("*, contact:contacts(first_name,last_name,company), salesperson:users!salesperson_id(name)")
    .order("scheduled_at", { ascending: true });

  if (session.role !== "admin") {
    query = query.eq("salesperson_id", Number(session.sub));
  } else if (salespersonId) {
    query = query.eq("salesperson_id", Number(salespersonId));
  }

  if (month) {
    const from = `${month}-01T00:00:00Z`;
    const [y, m] = month.split("-").map(Number);
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    const to = `${nextMonth}-01T00:00:00Z`;
    query = query.gte("scheduled_at", from).lt("scheduled_at", to);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ appointments: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { contact_id, salesperson_id, title, scheduled_at, duration_minutes, notes } = body;

  if (!contact_id || !scheduled_at) {
    return NextResponse.json({ error: "contact_id e scheduled_at obbligatori" }, { status: 400 });
  }

  const assignedSalesperson =
    session.role === "admin" ? (salesperson_id ?? session.sub) : session.sub;

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      contact_id: Number(contact_id),
      salesperson_id: Number(assignedSalesperson),
      title: title?.trim() || null,
      scheduled_at,
      duration_minutes: duration_minutes ?? 60,
      notes: notes?.trim() || null,
      status: "scheduled",
    })
    .select("*, contact:contacts(first_name,last_name,company), salesperson:users!salesperson_id(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggiorna appointment_date sul contatto
  await supabase
    .from("contacts")
    .update({ appointment_date: scheduled_at, appointment_status: "scheduled" })
    .eq("id", contact_id);

  return NextResponse.json({ appointment: data }, { status: 201 });
}
