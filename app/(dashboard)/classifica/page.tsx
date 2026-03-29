import { supabase } from "@/lib/supabase";
import LeaderboardClient from "./LeaderboardClient";

export default async function ClassificaPage() {
  const { data } = await supabase.rpc("get_leaderboard", { date_from: null });

  const rows = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    vendite_vinte: r.vendite_vinte,
    valore_totale: r.valore_totale,
    trattative_totali: r.trattative_totali,
    chiuse: r.chiuse,
    tasso_conversione: r.tasso_conversione ?? null,
  }));

  return <LeaderboardClient initialRows={rows} />;
}
