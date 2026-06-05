import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const contact_id = Number(params.id);

  const { data, error } = await supabase
    .from("contact_tags")
    .select("tag:tags(id, name, color)")
    .eq("contact_id", contact_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tags = (data ?? []).map((r) => (r as unknown as { tag: { id: number; name: string; color: string } }).tag);
  return NextResponse.json({ tags });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const contact_id = Number(params.id);
  const { tag_id } = await req.json();
  if (!tag_id) return NextResponse.json({ error: "tag_id obbligatorio" }, { status: 400 });

  const { error } = await supabase
    .from("contact_tags")
    .upsert({ contact_id, tag_id: Number(tag_id) });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
