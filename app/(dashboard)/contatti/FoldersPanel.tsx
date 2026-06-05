"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen, Folder, Plus, Pencil, Trash2, X, Check,
  Users, MessageSquare, PhoneOff,
} from "lucide-react";

type FolderItem = {
  id: number;
  name: string;
  contact_count: number;
};

type Props = {
  folders: FolderItem[];
  activeFolder: string | null; // folder ID (number string), "RSA", "NR", or null = tutti
  isAdmin: boolean;
  totalContacts: number;
  rsaCount: number;
  nrCount: number;
};

export default function FoldersPanel({
  folders: initialFolders,
  activeFolder,
  isAdmin,
  totalContacts,
  rsaCount,
  nrCount,
}: Props) {
  const router = useRouter();
  const [folders, setFolders] = useState(initialFolders);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");
  const [loading, setLoading] = useState(false);

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

  const itemBase =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors select-none";
  const activeClass = "bg-brand/15 text-brand-dark font-semibold";
  const inactiveClass = "text-text-muted hover:bg-gray-100 hover:text-text";

  return (
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

      {/* Virtual folders: RSA e NR */}
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
            <span className="text-xs tabular-nums mr-1">{folder.contact_count}</span>
            <span className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
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
  );
}
