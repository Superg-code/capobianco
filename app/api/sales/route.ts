import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = new URL(req.url);
  const status       = url.searchParams.get("status");
  const contactId    = url.searchParams.get("contact_id");
  const salespersonId = url.searchParams.get("salesperson_id");
  const isAdmin = session.role === "admin";
  const userId  = Number(session.sub);

  let query = supabase
    .from("sales")
    .select("*, contacts(first_name, last_name, company, city), salesperson:users!salesperson_id(name)")
    .order("updated_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("salesperson_id", userId);
  } else if (salespersonId) {
    query = query.eq("salesperson_id", Number(salespersonId));
  }
  if (status)    query = query.eq("status", status as "lead" | "prospect" | "trattativa" | "vinto" | "perso");
  if (contactId) query = query.eq("contact_id", Number(contactId));

  const { data } = await query;

  const sales = (data ?? []).map((s) => {
    const c  = (s as Record<string, unknown>).contacts as Record<string, unknown> | null;
    const sp = (s as Record<string, unknown>).salesperson as Record<string, unknown> | null;
    const { contacts: _c, salesperson: _sp, ...rest } = s as Record<string, unknown>;
    return { ...rest, first_name: c?.first_name, last_name: c?.last_name, company: c?.company, city: c?.city, salesperson_name: sp?.name };
  });

  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { contact_id, salesperson_id, status, product, value, notes } = body;

  if (!contact_id) return NextResponse.json({ error: "Contatto obbligatorio" }, { status: 400 });

  const assignedTo = session.role === "admin" && salesperson_id ? Number(salesperson_id) : Number(session.sub);

  const { data: sale } = await supabase
    .from("sales")
    .insert({
      contact_id:     Number(contact_id),
      salesperson_id: assignedTo,
      status:         status ?? "lead",
      product:        product?.trim() || null,
      value:          value ? Number(value) : null,
      notes:          notes?.trim() || null,
    })
    .select()
    .single();

  if (sale) {
    await supabase.from("activities").insert({
      sale_id:     sale.id,
      user_id:     Number(session.sub),
      description: "Vendita creata",
    });
  }

  // Fetch con join per risposta completa
  const { data: fullSale } = await supabase
    .from("sales")
    .select("*, contacts(first_name, last_name), salesperson:users!salesperson_id(name)")
    .eq("id", sale!.id)
    .single();

  const c  = (fullSale as Record<string, unknown>)?.contacts as Record<string, unknown> | null;
  const sp = (fullSale as Record<string, unknown>)?.salesperson as Record<string, unknown> | null;
  const { contacts: _c, salesperson: _sp, ...rest } = (fullSale ?? {}) as Record<string, unknown>;
  const flatSale = { ...rest, first_name: c?.first_name, last_name: c?.last_name, salesperson_name: sp?.name };

  return NextResponse.json({ sale: flatSale }, { status: 201 });
}
