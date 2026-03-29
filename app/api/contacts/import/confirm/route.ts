import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { ImportRowWithStatus } from "@/lib/duplicates";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { rows }: { rows: ImportRowWithStatus[] } = await req.json();

  if (!Array.isArray(rows)) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  const toImport = rows.filter((r) => r.action === "import" && r.isValid);

  if (toImport.length === 0) return NextResponse.json({ imported: 0, skipped: rows.length });

  const userId = Number(session.sub);

  const records = toImport.map((row) => ({
    first_name:    row.first_name?.trim() ?? "",
    last_name:     row.last_name?.trim()  ?? "",
    email:         row.email?.trim()      || null,
    phone:         row.phone?.trim()      || null,
    company:       row.company?.trim()    || null,
    city:          row.city?.trim()       || null,
    notes:         row.notes?.trim()      || null,
    created_by_id: userId,
  }));

  const { error } = await supabase.from("contacts").insert(records);

  if (error) {
    console.error("Import confirm error:", error);
    return NextResponse.json({ error: "Errore durante l'importazione" }, { status: 500 });
  }

  return NextResponse.json({ imported: records.length, skipped: rows.length - records.length });
}
