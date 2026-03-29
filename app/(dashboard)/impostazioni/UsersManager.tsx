"use client";

import { useState } from "react";
import { Plus, X, RefreshCw, Trash2, Shield, User } from "lucide-react";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

type Props = {
  users: UserRow[];
  currentUserId: number;
};

function generatePassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function UsersManager({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [newPass, setNewPass] = useState<{ id: number; password: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "salesperson" });
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
      if (!res.ok) {
        setError(data.error ?? "Errore");
        return;
      }
      setUsers((prev) => [...prev, data.user]);
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", role: "salesperson" });
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(userId: number) {
    const password = generatePassword();
    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, password }),
      });
      setNewPass({ id: userId, password });
    } catch {
      alert("Errore durante il reset della password");
    }
  }

  async function handleDelete(userId: number, userName: string) {
    if (!confirm(`Eliminare l'utente ${userName}? Questa azione è irreversibile.`)) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      alert("Errore durante l'eliminazione");
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-text">
          Utenti ({users.length})
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Aggiungi utente
        </button>
      </div>

      {/* New password reveal */}
      {newPass && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800">Password aggiornata</p>
            <p className="text-sm text-green-700 mt-0.5">
              Nuova password:{" "}
              <code className="bg-white rounded px-2 py-0.5 font-mono font-bold">
                {newPass.password}
              </code>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Copia e comunica questa password all&apos;utente. Non sarà più visibile.
            </p>
          </div>
          <button onClick={() => setNewPass(null)}>
            <X className="w-4 h-4 text-green-600" />
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
              <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">Ruolo</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">Aggiunto</th>
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
                    <span className="font-semibold text-text text-sm">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="ml-1.5 text-xs text-text-muted">(tu)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-text-muted">{user.email}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      user.role === "admin"
                        ? "bg-brand/15 text-brand-dark"
                        : "bg-gray-100 text-text-muted"
                    }`}
                  >
                    {user.role === "admin" ? (
                      <Shield className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    {user.role === "admin" ? "Amministratore" : "Venditore"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-text-muted">
                  {new Date(user.created_at).toLocaleDateString("it-IT")}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="p-1.5 text-text-muted hover:text-brand-dark hover:bg-brand/10 rounded-lg transition-colors"
                      title="Reset password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-text text-lg">Nuovo utente</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-1">Nome completo</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Mario Rossi"
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
                <label className="block text-sm font-semibold text-text mb-1">Password iniziale</label>
                <div className="flex gap-2">
                  <input
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    placeholder="Password..."
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, password: generatePassword() }))}
                    className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Genera
                  </button>
                </div>
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
                  {loading ? "..." : "Crea utente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
