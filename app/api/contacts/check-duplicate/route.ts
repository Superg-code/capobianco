import { checkSingleDuplicate } from "@/lib/duplicates";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = new URL(req.url);
  const email   = url.searchParams.get("email")   ?? undefined;
  const phone   = url.searchParams.get("phone")   ?? undefined;
  const excludeId = url.searchParams.get("excludeId") ? Number(url.searchParams.get("excludeId")) : undefined;

  if (!email && !phone) return NextResponse.json({ duplicates: [] });

  let duplicates = await checkSingleDuplicate(email, phone);

  if (excludeId != null) {
    duplicates = duplicates.filter((d) => d.existingContact.id !== excludeId);
  }

  return NextResponse.json({ duplicates });
}
