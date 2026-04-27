"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContactForm from "@/components/contacts/ContactForm";
import { Mail, Phone, Building2, MapPin, Edit, Trash2, Calendar, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import type { Contact } from "@/lib/db";

type Props = {
  contact: Contact & { created_by_name: string | null };
  isAdmin: boolean;
};

export default function ContactDetailClient({ contact, isAdmin }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [waStatus, setWaStatus] = useState<"idle" | "sent" | "error">("idle");
  const [waError, setWaError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Eliminare ${contact.first_name} ${contact.last_name}? Questa azione è irreversibile.`)) return;
    setDeleting(true);
    await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    router.push("/contatti");
    router.refresh();
  }

  async function handleStartWhatsApp() {
    setWaLoading(true);
    setWaError(null);
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

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-text">Modifica contatto</h2>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-text-muted hover:text-text"
          >
            Annulla
          </button>
        </div>
        <ContactForm
          initialData={contact}
          excludeId={contact.id}
          inline
          onSuccess={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  const hasActiveSession = Boolean(contact.n8n_session_id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="bg-brand/20 rounded-full w-12 h-12 flex items-center justify-center">
          <span className="text-lg font-bold text-brand-dark">
            {contact.first_name?.[0] ?? ""}{contact.last_name?.[0] ?? ""}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted"
            title="Modifica"
          >
            <Edit className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg hover:bg-red-50 transition-colors text-text-muted hover:text-red-500"
              title="Elimina"
            >
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

      {contact.notes && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-text-muted mb-1">Note</p>
          <p className="text-sm text-text">{contact.notes}</p>
        </div>
      )}

      {/* WhatsApp AI Conversation */}
      {contact.phone && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          {hasActiveSession ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Conversazione WhatsApp attiva
            </div>
          ) : waStatus === "sent" ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />
              Messaggio inviato via WhatsApp
            </div>
          ) : (
            <button
              onClick={handleStartWhatsApp}
              disabled={waLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
            >
              {waLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              {waLoading ? "Avvio in corso…" : "Avvia conversazione WhatsApp"}
            </button>
          )}
          {waStatus === "error" && waError && (
            <p className="text-xs text-red-500">{waError}</p>
          )}
        </div>
      )}

      {/* Conversation summary from AI */}
      {contact.conversation_summary && (
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
