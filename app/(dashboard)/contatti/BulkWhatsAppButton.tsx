"use client";

import { useState } from "react";
import { MessageCircle, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type EligibleContact = { id: number; first_name: string; last_name: string; phone: string };

type Phase = "idle" | "confirm" | "running" | "done";

export default function BulkWhatsAppButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [confirmText, setConfirmText] = useState("");
  const [contacts, setContacts] = useState<EligibleContact[]>([]);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState(0);

  async function openModal() {
    setConfirmText("");
    setPhase("confirm");
  }

  function closeModal() {
    if (phase === "running") return;
    setPhase("idle");
    setConfirmText("");
    setContacts([]);
    setProgress(0);
    setErrors(0);
  }

  async function handleConfirm() {
    if (confirmText.trim().toLowerCase() !== "sicuro") return;

    setPhase("running");
    setProgress(0);
    setErrors(0);

    const res = await fetch("/api/contacts/bulk-whatsapp");
    const data = await res.json();
    const eligible: EligibleContact[] = data.contacts ?? [];
    setContacts(eligible);

    if (eligible.length === 0) {
      setPhase("done");
      return;
    }

    let errCount = 0;
    for (let i = 0; i < eligible.length; i++) {
      const contact = eligible[i];
      try {
        const r = await fetch(`/api/contacts/${contact.id}/start-whatsapp`, { method: "POST" });
        if (!r.ok) errCount++;
      } catch {
        errCount++;
      }
      setProgress(i + 1);
      setErrors(errCount);
    }

    setPhase("done");
  }

  const canConfirm = confirmText.trim().toLowerCase() === "sicuro";

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Avvia tutte le conversazioni WhatsApp
      </button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-text text-lg">Avvia tutte le conversazioni</h2>
              {phase !== "running" && (
                <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              )}
            </div>

            {phase === "confirm" && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
                  <p className="text-sm font-semibold text-amber-800">Attenzione</p>
                  <p className="text-sm text-amber-700">
                    Questa azione avvierà una conversazione WhatsApp per tutti i contatti con numero di telefono
                    che non hanno già una conversazione attiva. L'operazione non è reversibile.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-1.5">
                    Scrivi <span className="font-mono bg-gray-100 px-1 rounded">sicuro</span> per confermare
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && canConfirm && handleConfirm()}
                    placeholder="sicuro"
                    autoFocus
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-1">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className="px-5 py-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 text-white font-semibold text-sm rounded-lg transition-colors"
                  >
                    Avvia
                  </button>
                </div>
              </>
            )}

            {phase === "running" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-[#25D366]" />
                  <p className="text-sm text-text">
                    Avvio conversazioni… {progress} / {contacts.length}
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#25D366] h-2 rounded-full transition-all duration-300"
                    style={{ width: contacts.length > 0 ? `${(progress / contacts.length) * 100}%` : "0%" }}
                  />
                </div>
                {errors > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors} errori finora
                  </p>
                )}
                <p className="text-xs text-text-muted">Non chiudere questa finestra durante l'operazione.</p>
              </div>
            )}

            {phase === "done" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {contacts.length === 0
                        ? "Nessun contatto disponibile"
                        : `${progress - errors} conversazioni avviate`}
                    </p>
                    {contacts.length > 0 && errors > 0 && (
                      <p className="text-xs text-amber-600">{errors} non avviate per errore</p>
                    )}
                    {contacts.length === 0 && (
                      <p className="text-xs text-text-muted">
                        Tutti i contatti con telefono hanno già una conversazione attiva.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-semibold bg-brand hover:bg-brand-dark text-text rounded-lg transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
