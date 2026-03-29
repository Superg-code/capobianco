"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DuplicateWarning from "@/components/ui/DuplicateWarning";
import type { DuplicateMatch } from "@/lib/duplicates";
import type { Contact } from "@/lib/db";

type Props = {
  initialData?: Partial<Contact>;
  excludeId?: number;
  onSuccess?: (contact: Contact) => void;
  inline?: boolean;
};

export default function ContactForm({ initialData, excludeId, onSuccess, inline }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    company: initialData?.company ?? "",
    city: initialData?.city ?? "",
    notes: initialData?.notes ?? "",
  });
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkDuplicates = useCallback(
    async (email?: string, phone?: string) => {
      if (!email && !phone) {
        setDuplicates([]);
        return;
      }
      const params = new URLSearchParams();
      if (email) params.set("email", email);
      if (phone) params.set("phone", phone);
      if (excludeId) params.set("excludeId", String(excludeId));
      const res = await fetch(`/api/contacts/check-duplicate?${params}`);
      const data = await res.json();
      setDuplicates(data.duplicates ?? []);
    },
    [excludeId]
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleBlurEmailPhone(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const email = name === "email" ? value : form.email;
    const phone = name === "phone" ? value : form.phone;
    await checkDuplicates(email || undefined, phone || undefined);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/contacts/${initialData!.id}` : "/api/contacts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Errore durante il salvataggio");
        return;
      }

      if (onSuccess) {
        onSuccess(data.contact);
      } else {
        router.push(`/contatti/${data.contact.id}`);
        router.refresh();
      }
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text mb-1">
            Nome
          </label>
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Mario"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1">
            Cognome
          </label>
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Rossi"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-text mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlurEmailPhone}
          className={inputClass}
          placeholder="mario@esempio.it"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-text mb-1">
          Telefono
        </label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlurEmailPhone}
          className={inputClass}
          placeholder="+39 333 1234567"
        />
      </div>

      {duplicates.length > 0 && <DuplicateWarning duplicates={duplicates} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text mb-1">
            Azienda
          </label>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            className={inputClass}
            placeholder="Azienda Agricola Rossi"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text mb-1">
            Città
          </label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            className={inputClass}
            placeholder="Milano"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-text mb-1">
          Note
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className={inputClass}
          placeholder="Note aggiuntive sul contatto..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        {!inline && (
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-semibold text-text-muted border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {loading
            ? "Salvataggio..."
            : initialData?.id
            ? "Salva modifiche"
            : "Crea contatto"}
        </button>
      </div>
    </form>
  );
}
