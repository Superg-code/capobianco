"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Search, ChevronLeft, ChevronRight, Users, Mail, Phone, Building2 } from "lucide-react";

type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  created_by_name: string | null;
  updated_at: string;
};

type Props = {
  contacts: Contact[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
};

export default function ContactsTable({ contacts, total, page, totalPages, q }: Props) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(q);
  const [, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/contatti?q=${encodeURIComponent(searchValue)}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Cerca per nome, email, telefono, azienda..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
        />
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-text-muted">
              {q ? `Nessun risultato per "${q}"` : "Nessun contatto ancora"}
            </p>
            {!q && (
              <Link href="/contatti/nuovo" className="text-brand-dark text-sm font-semibold hover:underline mt-2 inline-block">
                Aggiungi il primo contatto →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Telefono</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Azienda</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Città</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Inserito da</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/contatti/${contact.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-brand/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-brand-dark">
                            {contact.first_name?.[0] ?? ""}{contact.last_name?.[0] ?? ""}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-text">
                          {contact.first_name} {contact.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">
                      {contact.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">
                      {contact.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {contact.phone}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">
                      {contact.company ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {contact.company}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{contact.city ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-text-muted">{contact.created_by_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Pagina {page} di {totalPages} ({total} contatti)
          </p>
          <div className="flex gap-2">
            <Link
              href={`/contatti?q=${q}&page=${page - 1}`}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                page <= 1
                  ? "pointer-events-none opacity-40 border-gray-200"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Precedente
            </Link>
            <Link
              href={`/contatti?q=${q}&page=${page + 1}`}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                page >= totalPages
                  ? "pointer-events-none opacity-40 border-gray-200"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              Successiva <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
