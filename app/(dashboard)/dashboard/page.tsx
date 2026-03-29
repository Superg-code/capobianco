import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Users, TrendingUp, Trophy, Euro, Plus } from "lucide-react";

type StatCard = {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
};

export default async function DashboardPage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const userId = Number(session?.sub);

  // Totale contatti
  const { count: total_contacts } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true });

  // Vendite (filtrate per ruolo)
  let salesQuery = supabase
    .from("sales")
    .select("id, status, product, value, updated_at, contact_id, salesperson_id, contacts(first_name, last_name), salesperson:users!salesperson_id(name)")
    .order("updated_at", { ascending: false });

  if (!isAdmin) salesQuery = salesQuery.eq("salesperson_id", userId);

  const { data: salesRaw } = await salesQuery;
  const sales = (salesRaw ?? []) as Array<Record<string, unknown>>;

  // Calcola statistiche in JS
  const salesStats = {
    total:        sales.length,
    vinti:        sales.filter((s) => s.status === "vinto").length,
    persi:        sales.filter((s) => s.status === "perso").length,
    attivi:       sales.filter((s) => ["lead","prospect","trattativa"].includes(s.status as string)).length,
    valore_vinto: sales.filter((s) => s.status === "vinto").reduce((sum, s) => sum + ((s.value as number) ?? 0), 0),
  };

  // Ultime 5 vendite
  const recentSales = sales.slice(0, 5).map((s) => {
    const c = s.contacts as Record<string, unknown> | null;
    const sp = s.salesperson as Record<string, unknown> | null;
    return {
      id:               s.id as number,
      status:           s.status as string,
      product:          s.product as string | null,
      value:            s.value as number | null,
      updated_at:       s.updated_at as string,
      first_name:       (c?.first_name as string) ?? "",
      last_name:        (c?.last_name as string) ?? "",
      salesperson_name: (sp?.name as string) ?? "",
    };
  });

  const statCards: StatCard[] = [
    { label: "Contatti totali", value: total_contacts ?? 0, icon: Users, color: "bg-blue-50 text-blue-600", href: "/contatti" },
    { label: "Vendite attive", value: salesStats.attivi, sub: `${salesStats.total} totali`, icon: TrendingUp, color: "bg-amber-50 text-amber-600", href: "/vendite" },
    {
      label: "Vendite vinte",
      value: salesStats.vinti,
      sub: salesStats.total > 0 ? `${Math.round((salesStats.vinti / (salesStats.vinti + salesStats.persi || 1)) * 100)}% conv.` : "—",
      icon: Trophy,
      color: "bg-green-50 text-green-600",
      href: "/classifica",
    },
    { label: "Valore acquisito", value: formatEuro(salesStats.valore_vinto), sub: "vendite vinte", icon: Euro, color: "bg-brand/10 text-brand-dark", href: "/vendite" },
  ];

  const statusLabels: Record<string, { label: string; color: string }> = {
    lead:       { label: "Lead",       color: "bg-slate-100 text-slate-600" },
    prospect:   { label: "Prospect",   color: "bg-blue-100 text-blue-700" },
    trattativa: { label: "Trattativa", color: "bg-amber-100 text-amber-700" },
    vinto:      { label: "Vinto",      color: "bg-green-100 text-green-700" },
    perso:      { label: "Perso",      color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Dashboard</h1>
          <p className="text-text-muted text-sm mt-0.5">Benvenuto, {session?.name}</p>
        </div>
        <Link href="/contatti/nuovo" className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Nuovo contatto
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted mb-1">{card.label}</p>
                <p className="text-2xl font-heading font-bold text-text">{card.value}</p>
                {card.sub && <p className="text-xs text-text-muted mt-1">{card.sub}</p>}
              </div>
              <div className={`rounded-lg p-2.5 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-text">Attività recenti</h2>
          <Link href="/vendite" className="text-sm text-brand-dark font-semibold hover:underline">Vedi tutte →</Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-text-muted text-sm">Nessuna vendita ancora.</p>
            <Link href="/contatti/nuovo" className="text-brand-dark text-sm font-semibold hover:underline mt-1 inline-block">Aggiungi un contatto →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentSales.map((sale) => (
              <div key={sale.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-text-muted">{sale.first_name[0]}{sale.last_name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{sale.first_name} {sale.last_name}</p>
                    <p className="text-xs text-text-muted">{sale.product ?? "—"} · {sale.salesperson_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {sale.value != null && <span className="text-sm font-semibold text-text">{formatEuro(sale.value)}</span>}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusLabels[sale.status]?.color}`}>
                    {statusLabels[sale.status]?.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
