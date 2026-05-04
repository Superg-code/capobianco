import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import ContactsTable from "./ContactsTable";
import BulkWhatsAppButton from "./BulkWhatsAppButton";

type SearchParams = { q?: string; page?: string };

export default async function ContattiPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const q = searchParams.q ?? "";
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, company, city, updated_at, creator:users!created_by_id(name)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,company.ilike.%${q}%,city.ilike.%${q}%`
    );
  }

  const { data, count } = await query;

  const contacts = (data ?? []).map((c) => {
    const { creator, ...rest } = c as Record<string, unknown>;
    return { ...rest, created_by_name: (creator as Record<string, unknown> | null)?.name ?? null };
  }) as { id: number; first_name: string; last_name: string; email: string | null; phone: string | null; company: string | null; city: string | null; created_by_name: string | null; updated_at: string }[];

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Contatti</h1>
          <p className="text-text-muted text-sm mt-0.5">{total} contatti totali</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          {isAdmin && <BulkWhatsAppButton />}
          <Link
            href="/contatti/importa"
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-text font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importa Excel
          </Link>
          <Link
            href="/contatti/nuovo"
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuovo contatto
          </Link>
        </div>
      </div>
      <ContactsTable contacts={contacts} total={total} page={page} totalPages={totalPages} q={q} />
    </div>
  );
}
