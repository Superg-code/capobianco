"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type State = "loading" | "ready" | "invalid" | "success";

export default function AttivaAccountPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<State>("loading");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`/api/users/activate?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.name) { setUserName(d.name); setState("ready"); }
        else setState("invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Le password non coincidono"); return; }
    if (password.length < 8) { setError("La password deve essere di almeno 8 caratteri"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/users/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore"); return; }
      setState("success");
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Errore di connessione");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-brand h-1.5 w-full" />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-[#1a3464] px-8 py-7 flex flex-col items-center gap-3">
              <div className="rounded-xl overflow-hidden">
                <Image src="/cap.png" alt="Capobianco Trattori" width={120} height={120} className="object-contain" unoptimized />
              </div>
              <p className="text-brand font-heading font-semibold text-sm tracking-wide uppercase">
                Attivazione account
              </p>
            </div>

            <div className="px-8 py-8">
              {state === "loading" && (
                <p className="text-center text-text-muted text-sm">Verifica del link in corso…</p>
              )}

              {state === "invalid" && (
                <div className="text-center space-y-3">
                  <p className="text-red-600 font-semibold">Link non valido</p>
                  <p className="text-text-muted text-sm">Il link è già stato usato o non esiste. Contatta un amministratore.</p>
                </div>
              )}

              {state === "success" && (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-heading font-bold text-text text-lg">Account attivato!</p>
                  <p className="text-text-muted text-sm">Ora puoi accedere con la tua email e la password appena creata.</p>
                  <p className="text-xs text-text-muted">Reindirizzamento al login…</p>
                </div>
              )}

              {state === "ready" && (
                <>
                  <h1 className="text-xl font-heading font-bold text-text mb-1 text-center">
                    Benvenuto, {userName.split(" ")[0]}
                  </h1>
                  <p className="text-sm text-text-muted text-center mb-6">
                    Crea la tua password per accedere al CRM Capobianco.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-text mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimo 8 caratteri"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text mb-1.5">Conferma password</label>
                      <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Ripeti la password"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-brand hover:bg-brand-dark text-text font-heading font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {submitting ? "Attivazione…" : "Attiva account"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
