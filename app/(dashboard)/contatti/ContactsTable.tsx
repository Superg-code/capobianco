"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Search, ChevronLeft, ChevronRight, Users, Mail, Phone, Building2, FolderInput, X, Check } from "lucide-react";

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
  folder_id: number | null;
};

type Tag = { id: number; name: string; color: string };
type FolderItem = { id: number; name: string; contact_count: number };

type Props = {
  contacts: Contact[];
  tagsMap: Record<number, Tag[]>;
  folders: FolderItem[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
  activeFolder: string | null;
};

export default function ContactsTable({
  contacts,
  tagsMap,
  folders,
  total,
  page,
  totalPages,
  q,
  activeFolder,
}: Props) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(q);
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [movingTo, setMovingTo] = useState<number | null | "clear">(undefined as unknown as null);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [moving, setMoving] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (searchValue) params.set("q", searchValue);
      if (activeFolder) params.set("folder", activeFolder);
      router.push(`/contatti${params.toString() ? `?${params}` : ""}`);
    });
  }

  function toggleSelect(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c.id)));
    }
  }

  async function handleMoveSelected(folderId: number | null) {
    if (selected.size === 0) return;
    setMoving(true);
    setShowMoveDropdown(false);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/contacts/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder_id: folderId }),
          })
        )
      );
      setSelected(new Set());
      router.refresh();
    } finally {
      setMoving(false);
    }
  }

  const paginationBase = "/contatti?" + new URLSearchParams({
    ...(q ? { q } : {}),
    ...(activeFolder ? { folder: activeFolder } : {}),
  }).toString();

  function pageLink(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (activeFolder) params.set("folder", activeFolder);
    params.set("page", String(p));
    return `/contatti?${params}`;
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

      {/* Barra azioni selezione multipla */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-lg px-4 py-2.5">
          <span className="text-sm font-semibold text-brand-dark">
            {selected.size} contatt{selected.size === 1 ? "o" : "i"} selezionat{selected.size === 1 ? "o" : "i"}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMoveDropdown((v) => !v)}
              disabled={moving}
              className="flex items-center gap-1.5 text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FolderInput className="w-4 h-4" />
              {moving ? "Spostamento…" : "Sposta in cartella"}
            </button>
            {showMoveDropdown && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-52 py-1 max-h-60 overflow-y-auto">
                <button
                  onClick={() => handleMoveSelected(null)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-text-muted"
                >
                  Rimuovi dalla cartella
                </button>
                <div className="border-t border-gray-100 my-1" />
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveSelected(f.id)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-text"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto p-1.5 text-text-muted hover:text-text hover:bg-white/60 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-text-muted">
              {q ? `Nessun risultato per "${q}"` : "Nessun contatto in questa sezione"}
            </p>
            {!q && !activeFolder && (
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
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === contacts.length && contacts.length > 0}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-brand focus:ring-brand"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Telefono</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Azienda</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Città</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Tag</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide">Inserito da</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((contact) => {
                  const tags = tagsMap[contact.id] ?? [];
                  const isSelected = selected.has(contact.id);
                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? "bg-brand/5" : ""}`}
                      onClick={() => router.push(`/contatti/${contact.id}`)}
                    >
                      <td className="px-3 py-3" onClick={(e) => toggleSelect(contact.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-brand focus:ring-brand"
                        />
                      </td>
                      <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 text-sm text-text-muted">
                        {contact.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            {contact.email}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-muted">
                        {contact.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {contact.phone}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-muted">
                        {contact.company ? (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {contact.company}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-muted">{contact.city ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        {tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-text-muted">{contact.created_by_name ?? "—"}</td>
                    </tr>
                  );
                })}
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
              href={pageLink(page - 1)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                page <= 1
                  ? "pointer-events-none opacity-40 border-gray-200"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Precedente
            </Link>
            <Link
              href={pageLink(page + 1)}
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
