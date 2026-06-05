import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const folder_id = Number(params.id);
  const { tag_id } = await req.json();
  if (!tag_id) return NextResponse.json({ error: "tag_id obbligatorio" }, { status: 400 });

  const { error } = await supabase
    .from("folder_tags")
    .upsert({ folder_id, tag_id: Number(tag_id) });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const folder_id = Number(params.id);
  const url = new URL(req.url);
  const tag_id = Number(url.searchParams.get("tag_id"));
  if (!tag_id) return NextResponse.json({ error: "tag_id obbligatorio" }, { status: 400 });

  const { error } = await supabase
    .from("folder_tags")
    .delete()
    .eq("folder_id", folder_id)
    .eq("tag_id", tag_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
