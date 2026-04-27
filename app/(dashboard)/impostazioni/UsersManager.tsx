"use client";

import { useState } from "react";
import { Plus, X, Trash2, Shield, User, Copy, Check, Clock } from "lucide-react";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  zona: string | null;
  activation_token: string | null;
  created_at: string;
};

type Props = {
  users: UserRow[];
  currentUserId: number;
};

export default function UsersManager({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", zona: "", email: "", role: "salesperson" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore"); return; }
      setUsers((prev) => [...prev, data.user]);
      setShowAdd(false);
      setForm({ first_name: "", last_name: "", zona: "", email: "", role: "salesperson" });
      const link = `${window.location.origin}/attiva-account?token=${data.activation_token}`;
      setActivationLink(link);
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(userId: number, userName: string) {
    if (!confirm(`Eliminare l'utente ${userName}? Questa azione è irreversibile.`)) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert("Errore durante l'eliminazione");
    }
  }

  function copyLink() {
    if (!activationLink) return;
    navigator.clipboard.writeText(activationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-text">Utenti ({users.length})</h2>
        <button
          onClick={() => { setShowAdd(true); setActivationLink(null); }}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invita venditore
        </button>
      </div>

      {/* Activation link banner */}
      {activationLink && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">Venditore creato — invia questo link</p>
          <p className="text-xs text-green-700">Il venditore aprirà il link e si creerà la password. Il link è valido una sola volta.</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-white border border-green-200 rounded px-3 py-2 text-xs font-mono text-green-900 break-all">
              {activationLink}
            </code>
            <button
              onClick={copyLink}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiato!" : "Copia"}
            </button>
          </div>
          <button onClick={() => setActivationLink(null)} className="text-xs text-green-600 hover:underline">
            Chiudi
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">Utente</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">Zona</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">Ruolo</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-brand/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-dark">
                        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-text text-sm">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-1.5 text-xs text-text-muted">(tu)</span>
                        )}
                      </span>
                      {user.activation_token && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600">In attesa di attivazione</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-text-muted">{user.email}</td>
                <td className="px-5 py-3.5 text-sm text-text-muted">{user.zona ?? "—"}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    user.role === "admin" ? "bg-brand/15 text-brand-dark" : "bg-gray-100 text-text-muted"
                  }`}>
                    {user.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {user.role === "admin" ? "Amministratore" : "Venditore"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-text text-lg">Invita venditore</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Inserisci i dati del venditore. Riceverai un link da inviare: il venditore si creerà la password al primo accesso.
            </p>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Nome</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                    required
                    placeholder="Mario"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Cognome</label>
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                    required
                    placeholder="Rossi"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-1">Zona di competenza</label>
                <input
                  value={form.zona}
                  onChange={(e) => setForm((p) => ({ ...p, zona: e.target.value }))}
                  placeholder="es. Napoli, Caserta, Salerno"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  placeholder="mario@capobianco.it"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-1">Ruolo</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className={inputClass}
                >
                  <option value="salesperson">Venditore</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm rounded-lg disabled:opacity-50"
                >
                  {loading ? "…" : "Crea e genera link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
