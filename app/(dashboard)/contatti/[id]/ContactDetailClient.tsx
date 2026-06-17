"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ContactForm from "@/components/contacts/ContactForm";
import {
  Mail, Phone, Building2, MapPin, Edit, Trash2, Calendar,
  MessageCircle, Loader2, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Tag, Plus, X, Folder, Check, PhoneForwarded,
} from "lucide-react";
import type { Contact } from "@/lib/db";

type ConversationSummary = { id: number; contenuto: string; session_id: string; timestamp: string };
type TagItem = { id: number; name: string; color: string };
type FolderItem = { id: number; name: string };

type Props = {
  contact: Contact & { created_by_name: string | null };
  isAdmin: boolean;
  conversationSummaries: ConversationSummary[];
  conversationCount: number;
  initialTags: TagItem[];
  allTags: TagItem[];
  folders: FolderItem[];
};

export default function ContactDetailClient({
  contact,
  isAdmin,
  conversationSummaries,
  conversationCount,
  initialTags,
  allTags: allTagsInit,
  folders,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waStatus, setWaStatus] = useState<"idle" | "sent" | "error">("idle");
  const [waError, setWaError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [isRd, setIsRd] = useState(contact.ricontattare_dopo ?? false);

  // Tags state
  const [contactTags, setContactTags] = useState<TagItem[]>(initialTags);
  const [allTags, setAllTags] = useState<TagItem[]>(allTagsInit);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#ffc300");
  const [tagLoading, setTagLoading] = useState(false);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  // Folder state
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(contact.folder_id ?? null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const folderPickerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setShowTagPicker(false);
      }
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setShowFolderPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleDelete() {
    if (!confirm(`Eliminare ${contact.first_name} ${contact.last_name}? Questa azione è irreversibile.`)) return;
    setDeleting(true);
    await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    router.push("/contatti");
    router.refresh();
  }

  async function toggleRd() {
    const newVal = !isRd;
    setIsRd(newVal);
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ricontattare_dopo: newVal }),
    });
  }

  async function handleStartWhatsApp() {
    setWaLoading(true);
    setWaError(null);
    setWaStatus("idle");
    try {
      const res = await fetch(`/api/contacts/${contact.id}/start-whatsapp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setWaError(data.error ?? "Errore durante l'avvio");
        setWaStatus("error");
      } else {
        setWaStatus("sent");
        router.refresh();
      }
    } catch {
      setWaError("Errore di rete");
      setWaStatus("error");
    } finally {
      setWaLoading(false);
    }
  }

  async function addTag(tag: TagItem) {
    if (contactTags.some((t) => t.id === tag.id)) return;
    setTagLoading(true);
    try {
      await fetch(`/api/contacts/${contact.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tag.id }),
      });
      setContactTags((prev) => [...prev, tag]);
    } finally {
      setTagLoading(false);
    }
  }

  async function removeTag(tagId: number) {
    setTagLoading(true);
    try {
      await fetch(`/api/contacts/${contact.id}/tags/${tagId}`, { method: "DELETE" });
      setContactTags((prev) => prev.filter((t) => t.id !== tagId));
    } finally {
      setTagLoading(false);
    }
  }

  async function createAndAddTag() {
    if (!newTagName.trim()) return;
    setTagLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });
      const data = await res.json();
      if (res.ok) {
        const tag: TagItem = data.tag;
        setAllTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
        await addTag(tag);
        setNewTagName("");
        setNewTagColor("#ffc300");
      }
    } finally {
      setTagLoading(false);
    }
  }

  async function changeFolder(folderId: number | null) {
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    });
    setCurrentFolderId(folderId);
    setShowFolderPicker(false);
  }

  const currentFolder = folders.find((f) => f.id === currentFolderId);

  const TAG_COLORS = [
    "#ffc300", "#ef4444", "#3b82f6", "#10b981",
    "#8b5cf6", "#f97316", "#ec4899", "#6b7280",
  ];

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-text">Modifica contatto</h2>
          <button onClick={() => setEditing(false)} className="text-xs text-text-muted hover:text-text">
            Annulla
          </button>
        </div>
        <ContactForm
          initialData={contact}
          excludeId={contact.id}
          inline
          onSuccess={() => { setEditing(false); router.refresh(); }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="bg-brand/20 rounded-full w-12 h-12 flex items-center justify-center">
          <span className="text-lg font-bold text-brand-dark">
            {contact.first_name?.[0] ?? ""}{contact.last_name?.[0] ?? ""}
          </span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted" title="Modifica">
            <Edit className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button onClick={handleDelete} disabled={deleting} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-text-muted hover:text-red-500" title="Elimina">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-heading font-bold text-text text-lg">
          {contact.first_name} {contact.last_name}
        </h2>
      </div>

      <div className="space-y-2.5">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-text-muted hover:text-text group">
            <Mail className="w-4 h-4 text-text-light group-hover:text-brand" />
            {contact.email}
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-text-muted hover:text-text group">
            <Phone className="w-4 h-4 text-text-light group-hover:text-brand" />
            {contact.phone}
          </a>
        )}
        {contact.company && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Building2 className="w-4 h-4 text-text-light" />
            {contact.company}
          </div>
        )}
        {contact.city && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <MapPin className="w-4 h-4 text-text-light" />
            {contact.city}
          </div>
        )}
      </div>

      {/* Cartella */}
      <div className="flex items-center gap-2 pt-1" ref={folderPickerRef}>
        <Folder className="w-4 h-4 text-text-light flex-shrink-0" />
        <div className="relative">
          <button
            onClick={() => setShowFolderPicker((v) => !v)}
            className="text-sm text-text-muted hover:text-text transition-colors flex items-center gap-1"
          >
            {currentFolder ? (
              <span className="font-semibold text-brand-dark">{currentFolder.name}</span>
            ) : (
              <span className="italic">Nessuna cartella</span>
            )}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFolderPicker && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-48 py-1 max-h-52 overflow-y-auto">
              <button
                onClick={() => changeFolder(null)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-text-muted flex items-center gap-2"
              >
                {currentFolderId === null && <Check className="w-3.5 h-3.5 text-brand-dark" />}
                <span>Nessuna cartella</span>
              </button>
              <div className="border-t border-gray-100 my-1" />
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => changeFolder(f.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-text flex items-center gap-2"
                >
                  {currentFolderId === f.id && <Check className="w-3.5 h-3.5 text-brand-dark flex-shrink-0" />}
                  <span className={currentFolderId === f.id ? "font-semibold" : ""}>{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tag */}
      <div className="space-y-2" ref={tagPickerRef}>
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-text-light flex-shrink-0" />
          {contactTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => removeTag(tag.id)}
                disabled={tagLoading}
                className="hover:opacity-70 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setShowTagPicker((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-dashed border-gray-300 text-text-muted hover:border-brand hover:text-brand-dark transition-colors"
          >
            <Plus className="w-3 h-3" /> Tag
          </button>
        </div>

        {showTagPicker && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
            {/* Tag esistenti */}
            {allTags.filter((t) => !contactTags.some((ct) => ct.id === t.id)).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted mb-1.5">Tag esistenti</p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags
                    .filter((t) => !contactTags.some((ct) => ct.id === t.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTag(tag)}
                        disabled={tagLoading}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Crea nuovo tag */}
            <div>
              <p className="text-xs font-semibold text-text-muted mb-1.5">Crea nuovo tag</p>
              <div className="flex items-center gap-2">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createAndAddTag()}
                  placeholder="Nome tag..."
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                />
                <div className="flex items-center gap-1">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewTagColor(c)}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: newTagColor === c ? "#333" : "transparent",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={createAndAddTag}
                  disabled={tagLoading || !newTagName.trim()}
                  className="px-3 py-1.5 bg-brand hover:bg-brand-dark text-text text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {tagLoading ? "…" : "Crea"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {contact.notes && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-text-muted mb-1">Note</p>
          <p className="text-sm text-text">{contact.notes}</p>
        </div>
      )}

      {/* WhatsApp AI Conversation */}
      {contact.phone && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          {(conversationCount > 0 || contact.ultima_interazione) && (
            <div className="flex items-center gap-3 text-xs text-text-muted">
              {conversationCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {conversationCount} {conversationCount === 1 ? "conversazione" : "conversazioni"}
                </span>
              )}
              {contact.ultima_interazione && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(contact.ultima_interazione).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          )}

          {contact.n8n_session_id && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              Conversazione WhatsApp attiva
            </div>
          )}

          <button
            onClick={toggleRd}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors w-full justify-center ${
              isRd
                ? "border-blue-200 bg-blue-50 text-blue-700 font-semibold"
                : "border-gray-200 text-text-muted hover:border-blue-200 hover:text-blue-600"
            }`}
          >
            <PhoneForwarded className="w-3.5 h-3.5 flex-shrink-0" />
            {isRd ? "Ricontattare dopo (attivo)" : "Segna: ricontattare dopo"}
          </button>

          {waStatus === "sent" ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />
              Messaggio WhatsApp inviato
            </div>
          ) : (
            <button
              onClick={handleStartWhatsApp}
              disabled={waLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
            >
              {waLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {waLoading ? "Avvio in corso…" : contact.n8n_session_id ? "Avvia nuova conversazione" : "Avvia conversazione WhatsApp"}
            </button>
          )}
          {waStatus === "error" && waError && (
            <p className="text-xs text-red-500">{waError}</p>
          )}
        </div>
      )}

      {/* Archivio conversazioni */}
      {conversationSummaries.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <button
            onClick={() => setArchiveOpen((o) => !o)}
            className="w-full flex items-center justify-between text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Archivio conversazioni ({conversationSummaries.length})
            </span>
            {archiveOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {archiveOpen && (
            <div className="mt-2 space-y-2">
              {conversationSummaries.map((s) => (
                <div key={s.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    {new Date(s.timestamp).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-xs text-text leading-relaxed">{s.contenuto}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {contact.conversation_summary && conversationSummaries.length === 0 && (
        <div className="bg-amber-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Riassunto conversazione AI</p>
          <p className="text-sm text-text">{contact.conversation_summary}</p>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Calendar className="w-3.5 h-3.5" />
          Aggiunto da {contact.created_by_name ?? "—"} ·{" "}
          {new Date(contact.created_at).toLocaleDateString("it-IT")}
        </div>
      </div>
    </div>
  );
}
