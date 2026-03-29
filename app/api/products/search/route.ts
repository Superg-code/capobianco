import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = new URL(req.url);
  const categoria  = url.searchParams.get("categoria");
  const provincia  = url.searchParams.get("provincia");
  const budgetMax  = url.searchParams.get("budget_max");

  let query = supabase
    .from("products")
    .select("*")
    .eq("attivo", true)
    .order("prezzo", { ascending: true })
    .limit(10);

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  // Prodotti senza provincia assegnata sono disponibili ovunque
  if (provincia) {
    query = query.or(`provincia.eq.${provincia},provincia.is.null`);
  }

  if (budgetMax) {
    query = query.or(`prezzo.is.null,prezzo.lte.${Number(budgetMax)}`);
  }

  const { data: products } = await query;

  // Match score: categoria esatta +40, provincia esatta +10
  const scored = (products ?? []).map((p) => {
    let score = 50;
    if (p.categoria === categoria) score += 40;
    if (p.provincia === provincia) score += 10;
    return { ...p, match_score: score };
  });

  scored.sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json({ prodotti: scored, total: scored.length });
}
