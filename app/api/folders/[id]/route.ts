import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const id = Number(params.id);
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });

  const { data, error } = await supabase
    .from("contact_folders")
    .update({ name: name.trim() })
    .eq("id", id)
    .select("id, name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ folder: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const id = Number(params.id);

  // Scollega i contatti dalla cartella prima di eliminarla
  await supabase.from("contacts").update({ folder_id: null }).eq("folder_id", id);

  const { error } = await supabase.from("contact_folders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
