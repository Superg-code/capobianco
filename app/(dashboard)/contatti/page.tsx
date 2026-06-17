import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import ContactsTable from "./ContactsTable";
import BulkWhatsAppButton from "./BulkWhatsAppButton";
import FoldersPanel from "./FoldersPanel";

type SearchParams = { q?: string; page?: string; folder?: string };

export default async function ContattiPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const q = searchParams.q ?? "";
  const page = Math.max(1, Number(searchParams.page ?? "1"));
  const folderParam = searchParams.folder ?? null; // "RSA", "NR", o un folder ID numerico
  const limit = 20;
  const offset = (page - 1) * limit;

  // Carica cartelle con conteggio
  const { data: foldersData } = await supabase
    .from("contact_folders")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  const foldersWithCount = await Promise.all(
    (foldersData ?? []).map(async (folder) => {
      const { count } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("folder_id", folder.id);
      return { ...folder, contact_count: count ?? 0 };
    })
  );

  // Conteggi RSA e NR
  const { count: rsaCount } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .not("wa_contact_id", "is", null)
    .not("ultima_interazione", "is", null)
    .is("appointment_date", null);

  const { count: nrCount } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .not("wa_contact_id", "is", null)
    .is("ultima_interazione", null);

  // Conteggio RD (ricontattare dopo, senza appuntamento)
  const { count: rdCount } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("ricontattare_dopo", true)
    .is("appointment_date", null);

  // AP: contatti con >= 2 messaggi WhatsApp inbound e senza appuntamento
  const AP_THRESHOLD = 2;
  const { data: inboundData } = await supabase
    .from("interactions")
    .select("contact_id")
    .eq("tipo", "whatsapp_inbound");

  const inboundCounts: Record<number, number> = {};
  for (const r of inboundData ?? []) {
    inboundCounts[r.contact_id] = (inboundCounts[r.contact_id] ?? 0) + 1;
  }
  const apIds = Object.entries(inboundCounts)
    .filter(([, n]) => n >= AP_THRESHOLD)
    .map(([id]) => Number(id));

  const { count: apCount } = apIds.length > 0
    ? await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .in("id", apIds)
        .is("appointment_date", null)
    : { count: 0 };

  // Query contatti con filtro cartella
  let query = supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, phone, company, city, updated_at, folder_id, wa_contact_id, ultima_interazione, appointment_date, creator:users!created_by_id(name)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (folderParam === "RSA") {
    query = query
      .not("wa_contact_id", "is", null)
      .not("ultima_interazione", "is", null)
      .is("appointment_date", null);
  } else if (folderParam === "NR") {
    query = query
      .not("wa_contact_id", "is", null)
      .is("ultima_interazione", null);
  } else if (folderParam === "RD") {
    query = query
      .eq("ricontattare_dopo", true)
      .is("appointment_date", null);
  } else if (folderParam === "AP") {
    if (apIds.length > 0) {
      query = query
        .in("id", apIds)
        .is("appointment_date", null);
    } else {
      query = query.in("id", [-1]);
    }
  } else if (folderParam) {
    query = query.eq("folder_id", Number(folderParam));
  }

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,company.ilike.%${q}%,city.ilike.%${q}%`
    );
  }

  const { data, count } = await query;

  // Conta totale tutti contatti
  const { count: totalContacts } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true });

  const contacts = (data ?? []).map((c) => {
    const { creator, ...rest } = c as Record<string, unknown>;
    return { ...rest, created_by_name: (creator as Record<string, unknown> | null)?.name ?? null };
  }) as {
    id: number; first_name: string; last_name: string; email: string | null;
    phone: string | null; company: string | null; city: string | null;
    created_by_name: string | null; updated_at: string; folder_id: number | null;
  }[];

  // Carica tag per ogni contatto in un'unica query
  const contactIds = contacts.map((c) => c.id);
  let tagsMap: Record<number, { id: number; name: string; color: string }[]> = {};
  if (contactIds.length > 0) {
    const { data: ctData } = await supabase
      .from("contact_tags")
      .select("contact_id, tag:tags(id, name, color)")
      .in("contact_id", contactIds);

    for (const row of ctData ?? []) {
      const r = row as unknown as { contact_id: number; tag: { id: number; name: string; color: string } };
      if (!tagsMap[r.contact_id]) tagsMap[r.contact_id] = [];
      tagsMap[r.contact_id].push(r.tag);
    }
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const folderLabel =
    folderParam === "RSA" ? "RSA — Risposto, senza appuntamento"
    : folderParam === "NR" ? "NR — Non risposto"
    : folderParam === "RD" ? "RD — Ricontattare dopo"
    : folderParam === "AP" ? "AP — Alto potenziale"
    : folderParam
    ? (foldersWithCount.find((f) => String(f.id) === folderParam)?.name ?? "Cartella")
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Contatti</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {folderLabel ? (
              <><span className="font-semibold text-brand-dark">{folderLabel}</span> · {total} contatti</>
            ) : (
              <>{total} contatti{folderParam ? "" : " totali"}</>
            )}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          {isAdmin && <BulkWhatsAppButton />}
          <Link
            href={`/contatti/importa${folderParam && folderParam !== "RSA" && folderParam !== "NR" ? `?folder=${folderParam}` : ""}`}
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

      <div className="flex gap-5 items-start">
        {/* Pannello cartelle */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <FoldersPanel
            folders={foldersWithCount}
            activeFolder={folderParam}
            isAdmin={isAdmin}
            totalContacts={totalContacts ?? 0}
            rsaCount={rsaCount ?? 0}
            nrCount={nrCount ?? 0}
            rdCount={rdCount ?? 0}
            apCount={apCount ?? 0}
          />
        </div>

        {/* Tabella contatti */}
        <div className="flex-1 min-w-0">
          <ContactsTable
            contacts={contacts}
            tagsMap={tagsMap}
            folders={foldersWithCount}
            total={total}
            page={page}
            totalPages={totalPages}
            q={q}
            activeFolder={folderParam}
          />
        </div>
      </div>
    </div>
  );
}
