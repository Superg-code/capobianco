"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContactForm from "@/components/contacts/ContactForm";
import { Mail, Phone, Building2, MapPin, Edit, Trash2, Calendar } from "lucide-react";
import type { Contact } from "@/lib/db";

type Props = {
  contact: Contact & { created_by_name: string | null };
  isAdmin: boolean;
};

export default function ContactDetailClient({ contact, isAdmin }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Eliminare ${contact.first_name} ${contact.last_name}? Questa azione è irreversibile.`)) return;
    setDeleting(true);
    await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    router.push("/contatti");
    router.refresh();
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
