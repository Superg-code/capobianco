import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import ContactDetailClient from "./ContactDetailClient";
import type { Contact, Sale } from "@/lib/db";

type SaleWithDetails = Sale & { salesperson_name: string };

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const contactId = Number(params.id);

  const { data: raw } = await supabase
    .from("contacts")
    .select("*, creator:users!created_by_id(name)")
    .eq("id", contactId)
    .maybeSingle();

  if (!raw) notFound();

  const { creator, ...contactRest } = raw as Record<string, unknown>;
  const contact = { ...contactRest, created_by_name: (creator as Record<string, unknown> | null)?.name ?? null } as Contact & { created_by_name: string | null };

  const { data: salesRaw } = await supabase
    .from("sales")
    .select("*, salesperson:users!salesperson_id(name)")
    .eq("contact_id", contactId)
    .order("updated_at", { ascending: false });

  const sales: SaleWithDetails[] = (salesRaw ?? []).map((s) => {
    const { salesperson, ...rest } = s as Record<string, unknown>;
    return { ...rest, salesperson_name: (salesperson as Record<string, unknown> | null)?.name ?? "" } as SaleWithDetails;
  });

  const statusInfo: Record<string, { label: string; color: string }> = {
    lead:       { label: "Lead",       color: "bg-slate-100 text-slate-600" },
    prospect:   { label: "Prospect",   color: "bg-blue-100 text-blue-700" },
    trattativa: { label: "Trattativa", color: "bg-amber-100 text-amber-700" },
    vinto:      { label: "Vinto",      color: "bg-green-100 text-green-700" },
    perso:      { label: "Perso",      color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/contatti" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-text">
            {contact.first_name} {contact.last_name}
          </h1>
          {contact.company && <p className="text-text-muted text-sm">{contact.company}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <ContactDetailClient contact={contact} isAdmin={session?.role === "admin"} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading font-bold text-text">Vendite ({sales.length})</h2>
              <AddSaleButton contactId={contactId} />
            </div>

            {sales.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-text-muted text-sm">Nessuna vendita associata.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sales.map((sale) => (
                  <div key={sale.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text text-sm">{sale.product ?? "Prodotto non specificato"}</p>
                        <p className="text-xs text-text-muted mt-0.5">Venditore: {sale.salesperson_name}</p>
                        {sale.notes && <p className="text-xs text-text-muted mt-1 italic">{sale.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {sale.value != null && (
                          <span className="text-sm font-bold text-text">
                            {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(sale.value)}
                          </span>
                        )}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo[sale.status]?.color}`}>
                          {statusInfo[sale.status]?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddSaleButton({ contactId }: { contactId: number }) {
  return (
    <Link href={`/vendite?new=1&contact_id=${contactId}`} className="flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
      <Plus className="w-4 h-4" />
      Nuova vendita
    </Link>
  );
}
