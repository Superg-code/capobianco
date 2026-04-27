"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Errore durante il login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top brand bar */}
      <div className="bg-brand h-1.5 w-full" />

      {/* Tractor animation strip */}
      <div className="w-full overflow-hidden h-20 relative bg-gray-50 select-none pointer-events-none">
        <style>{`
          @keyframes drive-rtl {
            0%   { transform: translateX(100vw); }
            100% { transform: translateX(-160px); }
          }
          .tractor-run {
            position: absolute;
            bottom: 6px;
            font-size: 3.8rem;
            line-height: 1;
            animation: drive-rtl 22s linear infinite;
          }
        `}</style>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
        <span className="tractor-run" style={{ animationDelay: "0s" }}>🚜</span>
        <span className="tractor-run" style={{ animationDelay: "11s" }}>🚜</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a3464] px-8 py-7 flex flex-col items-center gap-3">
              <div className="rounded-xl overflow-hidden">
                <Image
                  src="/cap.png"
                  alt="Capobianco Trattori"
                  width={160}
                  height={160}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <p className="text-brand font-heading font-semibold text-sm tracking-wide uppercase">
                CRM Commerciale
              </p>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <h1 className="text-xl font-heading font-bold text-text mb-6 text-center">
                Accedi al tuo account
              </h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@capobianco.it"
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                  disabled={loading}
                  className="w-full bg-brand hover:bg-brand-dark text-text font-heading font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "Accesso in corso..." : "Accedi"}
                </button>
              </form>
            </div>
          </div>

          <div className="text-center mt-6 space-y-1">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} Capobianco Group — Sistema CRM Interno
            </p>
            <div className="flex items-center justify-center gap-3 text-xs">
              <a
                href="/cancellazione-dati"
                className="text-text-muted hover:text-brand underline underline-offset-2 transition-colors"
              >
                Cancellazione dati
              </a>
              <span className="text-gray-300">·</span>
              <a
                href="/privacy"
                className="text-text-muted hover:text-brand underline underline-offset-2 transition-colors"
              >
                Informativa sulla privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
