import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import SalesKanban from "@/components/sales/SalesKanban";
import NewSaleModal from "./NewSaleModal";

export default async function VenditePage({ searchParams }: { searchParams: { new?: string; contact_id?: string } }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const userId = Number(session?.sub);

  let salesQuery = supabase
    .from("sales")
    .select("id, contact_id, status, product, value, contacts(first_name, last_name, company, city), salesperson:users!salesperson_id(name)")
    .order("updated_at", { ascending: false });

  if (!isAdmin) salesQuery = salesQuery.eq("salesperson_id", userId);

  const { data: salesRaw } = await salesQuery;

  const sales = (salesRaw ?? []).map((s) => {
    const c  = (s as Record<string, unknown>).contacts as Record<string, unknown> | null;
    const sp = (s as Record<string, unknown>).salesperson as Record<string, unknown> | null;
    return {
      id:               (s as Record<string, unknown>).id as number,
      contact_id:       (s as Record<string, unknown>).contact_id as number,
      status:           (s as Record<string, unknown>).status as string,
      product:          (s as Record<string, unknown>).product as string | null,
      value:            (s as Record<string, unknown>).value as number | null,
      first_name:       (c?.first_name as string) ?? "",
      last_name:        (c?.last_name as string) ?? "",
      company:          (c?.company as string | null) ?? null,
      city:             (c?.city as string | null) ?? null,
      salesperson_name: (sp?.name as string) ?? "",
    };
  });

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, company")
    .order("first_name")
    .limit(500);

  const salespeople = isAdmin
    ? (await supabase.from("users").select("id, name").order("name")).data ?? []
    : [];

  const preContactId = searchParams.contact_id ? Number(searchParams.contact_id) : undefined;
  const openNew = searchParams.new === "1";

  const stats = {
    total:  sales.length,
    lead:   sales.filter((s) => s.status === "lead").length,
    vinto:  sales.filter((s) => s.status === "vinto").length,
    valore: sales.filter((s) => s.status === "vinto").reduce((sum, s) => sum + (s.value ?? 0), 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Vendite</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {stats.total} vendite · {stats.vinto} vinte ·{" "}
            {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(stats.valore)} acquisiti
          </p>
        </div>
        <NewSaleModal contacts={contacts ?? []} salespeople={salespeople} isAdmin={isAdmin} defaultContactId={preContactId} defaultOpen={openNew} />
      </div>

      {sales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-20 text-center">
          <p className="text-text-muted text-sm">Nessuna vendita ancora.</p>
          <p className="text-text-muted text-xs mt-1">Aggiungi una vendita da un contatto o usa il pulsante qui sopra.</p>
        </div>
      ) : (
        <SalesKanban sales={sales} />
      )}
    </div>
  );
}
