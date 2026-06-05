import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// Returns contacts with a phone number, optionally filtered by folder_id
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const url = new URL(req.url);
  const folderId = url.searchParams.get("folder_id");

  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, phone")
    .not("phone", "is", null)
    .order("updated_at", { ascending: false });

  if (folderId) {
    query = query.eq("folder_id", Number(folderId));
  }

  const { data } = await query;
  return NextResponse.json({ contacts: data ?? [] });
}
