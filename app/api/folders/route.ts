import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data, error } = await supabase
    .from("contact_folders")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Conta contatti per cartella
  const foldersWithCount = await Promise.all(
    (data ?? []).map(async (folder) => {
      const { count } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("folder_id", folder.id);
      return { ...folder, contact_count: count ?? 0 };
    })
  );

  return NextResponse.json({ folders: foldersWithCount });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });

  const { data, error } = await supabase
    .from("contact_folders")
    .insert({ name: name.trim(), created_by_id: Number(session.sub) })
    .select("id, name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ folder: { ...data, contact_count: 0 } }, { status: 201 });
}
