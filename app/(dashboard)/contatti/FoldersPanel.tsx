"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen, Folder, Plus, Pencil, Trash2, X, Check,
  Users, MessageSquare, PhoneOff, MessageCircle,
  Loader2, CheckCircle2, AlertCircle, PhoneForwarded, Star,
} from "lucide-react";

type FolderItem = {
  id: number;
  name: string;
  contact_count: number;
};

type Props = {
  folders: FolderItem[];
  activeFolder: string | null;
  isAdmin: boolean;
  totalContacts: number;
  rsaCount: number;
  nrCount: number;
  rdCount: number;
  apCount: number;
};

type WaPhase = "idle" | "confirm" | "running" | "done";
type EligibleContact = { id: number; first_name: string; last_name: string; phone: string };

export default function FoldersPanel({
  folders: initialFolders,
  activeFolder,
  isAdmin,
  totalContacts,
  rsaCount,
  nrCount,
  rdCount,
  apCount,
}: Props) {
  const router = useRouter();
  const [folders, setFolders] = useState(initialFolders);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");
  const [loading, setLoading] = useState(false);

  // WA modal state
  const [waPhase, setWaPhase] = useState<WaPhase>("idle");
  const [waFolder, setWaFolder] = useState<FolderItem | null>(null);
  const [waContacts, setWaContacts] = useState<EligibleContact[]>([]);
  const [waProgress, setWaProgress] = useState(0);
  const [waErrors, setWaErrors] = useState(0);
  const [waConfirmText, setWaConfirmText] = useState("");

  function navigate(folder: string | null) {
    const params = new URLSearchParams();
    if (folder) params.set("folder", folder);
    router.push(`/contatti${params.toString() ? `?${params}` : ""}`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders((prev) => [...prev, data.folder].sort((a, b) => a.name.localeCompare(b.name)));
        setCreating(false);
        setNewName("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRename(id: number) {
    if (!renameName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders((prev) =>
          prev.map((f) => (f.id === id ? { ...f, name: data.folder.name } : f))
        );
        setRenamingId(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Eliminare la cartella "${name}"? I contatti non verranno eliminati.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        if (activeFolder === String(id)) navigate(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function openWaModal(folder: FolderItem, e: React.MouseEvent) {
    e.stopPropagation();
    setWaFolder(folder);
    setWaContacts([]);
    setWaProgress(0);
    setWaErrors(0);
    setWaConfirmText("");
    setWaPhase("confirm");
  }

  function closeWaModal() {
    if (waPhase === "running") return;
    setWaPhase("idle");
    setWaFolder(null);
  }

  async function handleWaStart() {
    if (waConfirmText.trim().toLowerCase() !== "sicuro" || !waFolder) return;

    setWaPhase("running");
    setWaProgress(0);
    setWaErrors(0);

    const res = await fetch(`/api/contacts/bulk-whatsapp?folder_id=${waFolder.id}`);
    const data = await res.json();
    const eligible: EligibleContact[] = data.contacts ?? [];
    setWaContacts(eligible);

    if (eligible.length === 0) {
      setWaPhase("done");
      return;
    }

    let errCount = 0;
    for (let i = 0; i < eligible.length; i++) {
      try {
        const r = await fetch(`/api/contacts/${eligible[i].id}/start-whatsapp`, { method: "POST" });
        if (!r.ok) errCount++;
      } catch {
        errCount++;
      }
      setWaProgress(i + 1);
      setWaErrors(errCount);
    }
    setWaPhase("done");
  }

  const itemBase =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors select-none";
  const activeClass = "bg-brand/15 text-brand-dark font-semibold";
  const inactiveClass = "text-text-muted hover:bg-gray-100 hover:text-text";
  const canWaConfirm = waConfirmText.trim().toLowerCase() === "sicuro";

  return (
    <>
      <div className="w-56 flex-shrink-0 space-y-1">
        {/* Tutti i contatti */}
        <div
          onClick={() => navigate(null)}
          className={`${itemBase} ${!activeFolder ? activeClass : inactiveClass}`}
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">Tutti</span>
          <span className="text-xs font-semibold tabular-nums">{totalContacts}</span>
        </div>

        {/* RSA */}
        <div
          onClick={() => navigate("RSA")}
          className={`${itemBase} ${activeFolder === "RSA" ? activeClass : inactiveClass}`}
          title="Ha risposto su WhatsApp ma non ha preso un appuntamento"
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0 text-amber-500" />
          <span className="flex-1 truncate">RSA</span>
          {rsaCount > 0 && (
            <span className="text-xs font-semibold tabular-nums">{rsaCount}</span>
          )}
        </div>

        {/* NR */}
        <div
          onClick={() => navigate("NR")}
          className={`${itemBase} ${activeFolder === "NR" ? activeClass : inactiveClass}`}
          title="Non ha risposto al messaggio WhatsApp"
        >
          <PhoneOff className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span className="flex-1 truncate">NR</span>
          {nrCount > 0 && (
            <span className="text-xs font-semibold tabular-nums">{nrCount}</span>
          )}
        </div>

        {/* RD - Ricontattare Dopo */}
        <div
          onClick={() => navigate("RD")}
          className={`${itemBase} ${activeFolder === "RD" ? activeClass : inactiveClass}`}
          title="Ha chiesto di essere ricontattato in un altro momento"
        >
          <PhoneForwarded className="w-4 h-4 flex-shrink-0 text-blue-400" />
          <span className="flex-1 truncate">RD</span>
          {rdCount > 0 && (
            <span className="text-xs font-semibold tabular-nums">{rdCount}</span>
          )}
        </div>

        {/* AP - Alto Potenziale */}
        <div
          onClick={() => navigate("AP")}
          className={`${itemBase} ${activeFolder === "AP" ? activeClass : inactiveClass}`}
          title="Ha mandato più messaggi su WhatsApp ma non ha preso appuntamento"
        >
          <Star className="w-4 h-4 flex-shrink-0 text-yellow-500" />
          <span className="flex-1 truncate">AP</span>
          {apCount > 0 && (
            <span className="text-xs font-semibold tabular-nums">{apCount}</span>
          )}
        </div>

        {folders.length > 0 && (
          <div className="border-t border-gray-100 pt-1 mt-1" />
        )}

        {/* Cartelle utente */}
        {folders.map((folder) =>
          renamingId === folder.id ? (
            <form
              key={folder.id}
              onSubmit={(e) => { e.preventDefault(); handleRename(folder.id); }}
              className="flex items-center gap-1 px-2"
            >
              <input
                autoFocus
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                className="flex-1 text-sm border border-brand rounded px-2 py-1 focus:outline-none"
              />
              <button type="submit" disabled={loading} className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setRenamingId(null)} className="p-1 text-text-muted hover:bg-gray-100 rounded">
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div
              key={folder.id}
              className={`group ${itemBase} ${activeFolder === String(folder.id) ? activeClass : inactiveClass}`}
              onClick={() => navigate(String(folder.id))}
            >
              {activeFolder === String(folder.id) ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="flex-1 truncate">{folder.name}</span>
              <span className="text-xs tabular-nums">{folder.contact_count}</span>
              <span className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 ml-1">
                {/* Bottone WA per cartella */}
                <button
                  onClick={(e) => openWaModal(folder, e)}
                  className="p-0.5 text-[#25D366] hover:bg-green-50 rounded"
                  title={`Avvia conversazioni WhatsApp per "${folder.name}"`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setRenamingId(folder.id); setRenameName(folder.name); }}
                  className="p-0.5 text-text-muted hover:text-text rounded"
                  title="Rinomina"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, folder.name); }}
                    className="p-0.5 text-text-muted hover:text-red-500 rounded"
                    title="Elimina"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </span>
            </div>
          )
        )}

        {/* Crea nuova cartella */}
        {creating ? (
          <form
            onSubmit={handleCreate}
            className="flex items-center gap-1 px-2 pt-1"
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome cartella..."
              className="flex-1 text-sm border border-brand rounded px-2 py-1 focus:outline-none"
            />
            <button type="submit" disabled={loading} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => { setCreating(false); setNewName(""); }} className="p-1 text-text-muted hover:bg-gray-100 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-brand-dark hover:bg-brand/5 rounded-lg w-full transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuova cartella
          </button>
        )}
      </div>

      {/* Modal WA per cartella */}
      {waPhase !== "idle" && waFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeWaModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-text text-lg">
                WhatsApp — {waFolder.name}
              </h2>
              {waPhase !== "running" && (
                <button onClick={closeWaModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              )}
            </div>

            {waPhase === "confirm" && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
                  <p className="text-sm font-semibold text-amber-800">Attenzione</p>
                  <p className="text-sm text-amber-700">
                    Verrà avviata una conversazione WhatsApp per tutti i contatti nella cartella{" "}
                    <strong>"{waFolder.name}"</strong> con numero di telefono ({waFolder.contact_count} contatti).
                    L'operazione non è reversibile.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Scrivi <span className="font-mono bg-gray-100 px-1 rounded">sicuro</span> per confermare
                  </label>
                  <input
                    type="text"
                    value={waConfirmText}
                    onChange={(e) => setWaConfirmText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canWaConfirm && handleWaStart()}
                    placeholder="sicuro"
                    autoFocus
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-1">
                  <button
                    onClick={closeWaModal}
                    className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleWaStart}
                    disabled={!canWaConfirm}
                    className="flex items-center gap-2 px-5 py-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 text-white font-semibold text-sm rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Avvia
                  </button>
                </div>
              </>
            )}

            {waPhase === "running" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#25D366]" />
                  <p className="text-sm text-text">
                    Avvio conversazioni… {waProgress} / {waContacts.length}
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#25D366] h-2 rounded-full transition-all duration-300"
                    style={{ width: waContacts.length > 0 ? `${(waProgress / waContacts.length) * 100}%` : "0%" }}
                  />
                </div>
                {waErrors > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {waErrors} errori finora
                  </p>
                )}
                <p className="text-xs text-text-muted">Non chiudere questa finestra durante l'operazione.</p>
              </div>
            )}

            {waPhase === "done" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {waContacts.length === 0
                        ? "Nessun contatto con telefono in questa cartella"
                        : `${waProgress - waErrors} conversazioni avviate`}
                    </p>
                    {waContacts.length > 0 && waErrors > 0 && (
                      <p className="text-xs text-amber-600">{waErrors} non avviate per errore</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeWaModal}
                    className="px-4 py-2 text-sm font-semibold bg-brand hover:bg-brand-dark text-text rounded-lg transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
