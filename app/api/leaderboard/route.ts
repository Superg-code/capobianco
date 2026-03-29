import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "all";

  const now = new Date();
  let dateFrom: string | null = null;

  if (period === "month") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    dateFrom = new Date(now.getFullYear(), q * 3, 1).toISOString();
  } else if (period === "year") {
    dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  const { data, error } = await supabase.rpc("get_leaderboard", { date_from: dateFrom });

  if (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Errore nel calcolo classifica" }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [] });
}
