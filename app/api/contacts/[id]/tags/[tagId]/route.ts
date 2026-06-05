import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string; tagId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { error } = await supabase
    .from("contact_tags")
    .delete()
    .eq("contact_id", Number(params.id))
    .eq("tag_id", Number(params.tagId));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
