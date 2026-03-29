"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { STATUSES } from "@/components/sales/StatusBadge";

type Contact = { id: number; first_name: string; last_name: string; company: string | null };
type Salesperson = { id: number; name: string };

type Props = {
  contacts: Contact[];
  salespeople: Salesperson[];
  isAdmin: boolean;
  defaultContactId?: number;
  defaultOpen?: boolean;
};

export default function NewSaleModal({ contacts, salespeople, isAdmin, defaultContactId, defaultOpen }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [form, setForm] = useState({
    contact_id: defaultContactId ? String(defaultContactId) : "",
    salesperson_id: "",
    status: "lead",
    product: "",
    value: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  const filteredContacts = contacts.filter(
    (c) =>
      !contactSearch ||
      `${c.first_name} ${c.last_name} ${c.company ?? ""}`
        .toLowerCase()
        .includes(contactSearch.toLowerCase())
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_id) {
      setError("Seleziona un contatto");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contact_id: Number(form.contact_id),
          salesperson_id: form.salesperson_id ? Number(form.salesperson_id) : undefined,
          value: form.value ? Number(form.value) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition bg-white";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nuova vendita
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-text text-lg">Nuova vendita</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact search */}
              <div>
                <label className="block text-sm font-semibold text-text mb-1">
                  Contatto *
                </label>
                <input
                  placeholder="Cerca contatto..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className={`${inputClass} mb-1`}
                />
                <select
                  name="contact_id"
                  value={form.contact_id}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  size={4}
                >
                  <option value="">— Seleziona —</option>
                  {filteredContacts.slice(0, 50).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                      {c.company ? ` — ${c.company}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">
                    Assegna a
                  </label>
                  <select name="salesperson_id" value={form.salesperson_id} onChange={handleChange} className={inputClass}>
                    <option value="">— Me stesso —</option>
                    {salespeople.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Stato</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Valore (€)</label>
                  <input
                    type="number"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-1">Prodotto / Trattore</label>
                <input
                  name="product"
                  value={form.product}
                  onChange={handleChange}
                  placeholder="es. New Holland T6.180"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-1">Note</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Note sulla vendita..."
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm rounded-lg disabled:opacity-50"
                >
                  {loading ? "..." : "Crea vendita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
