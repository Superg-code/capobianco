import { supabase } from "@/lib/supabase";
import { getSessionOrToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("attivo", true)
    .order("categoria")
    .order("nome");

  return NextResponse.json({ products: products ?? [] });
}

export async function POST(req: Request) {
  const session = await getSessionOrToken(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const body = await req.json();
  const { nome, categoria, prezzo, descrizione, provincia } = body;

  if (!nome?.trim() || !categoria?.trim()) {
    return NextResponse.json({ error: "nome e categoria obbligatori" }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      nome:       nome.trim(),
      categoria:  categoria.trim(),
      prezzo:     prezzo     ?? null,
      descrizione: descrizione ?? null,
      provincia:  provincia  ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio" }, { status: 500 });
  }

  return NextResponse.json({ product }, { status: 201 });
}
