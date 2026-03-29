import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const saleId = Number(params.id);

  const { data: existing } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .single();

  if (!existing) return NextResponse.json({ error: "Vendita non trovata" }, { status: 404 });

  if (session.role !== "admin" && existing.salesperson_id !== Number(session.sub)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = await req.json();
  const { status, product, value, notes, salesperson_id } = body;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status !== undefined)  updates.status  = status;
  if (product !== undefined) updates.product = product?.trim() || null;
  if (value   !== undefined) updates.value   = value != null ? Number(value) : null;
  if (notes   !== undefined) updates.notes   = notes?.trim() || null;
  if (session.role === "admin" && salesperson_id) {
    updates.salesperson_id = Number(salesperson_id);
  }

  await supabase.from("sales").update(updates).eq("id", saleId);

  if (status && status !== existing.status) {
    const statusLabels: Record<string, string> = {
      lead: "Lead",
      prospect: "Prospect",
      trattativa: "Trattativa",
      vinto: "Vinto",
      perso: "Perso",
    };
    await supabase.from("activities").insert({
      sale_id:     saleId,
      user_id:     Number(session.sub),
      description: `Stato aggiornato: ${statusLabels[existing.status] ?? existing.status} → ${statusLabels[status] ?? status}`,
    });
  }

  const { data: fullSale } = await supabase
    .from("sales")
    .select("*, contacts(first_name, last_name, company, city), salesperson:users!salesperson_id(name)")
    .eq("id", saleId)
    .single();

  const { contacts, salesperson, ...rest } = (fullSale ?? {}) as Record<string, unknown>;
  const c  = contacts   as Record<string, unknown> | null;
  const sp = salesperson as Record<string, unknown> | null;
  const sale = { ...rest, first_name: c?.first_name, last_name: c?.last_name, company: c?.company, city: c?.city, salesperson_name: sp?.name };

  return NextResponse.json({ sale });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await supabase.from("sales").delete().eq("id", Number(params.id));
  return NextResponse.json({ ok: true });
}
