import { parseExcelBuffer } from "@/lib/excel-parser";
import { analyzeImportRows } from "@/lib/duplicates";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "File non trovato" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rows = parseExcelBuffer(buffer);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Il file non contiene righe valide" }, { status: 400 });
    }

    const analyzed = await analyzeImportRows(rows);

    const summary = {
      total:      analyzed.length,
      toImport:   analyzed.filter((r) => r.action === "import").length,
      toSkip:     analyzed.filter((r) => r.action === "skip").length,
      duplicates: analyzed.filter((r) => r.duplicates.length > 0).length,
      withinFile: analyzed.filter((r) => r.withinFileConflict).length,
      invalid:    analyzed.filter((r) => !r.isValid).length,
    };

    return NextResponse.json({ rows: analyzed, summary });
  } catch (err) {
    console.error("Import preview error:", err);
    return NextResponse.json({ error: "Errore nel parsing del file. Verifica il formato." }, { status: 400 });
  }
}
