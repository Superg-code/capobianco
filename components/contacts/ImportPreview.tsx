"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import type { ImportRowWithStatus } from "@/lib/duplicates";

type Props = {
  rows: ImportRowWithStatus[];
  summary: {
    total: number;
    toImport: number;
    toSkip: number;
    duplicates: number;
    withinFile: number;
    invalid: number;
  };
  onBack: () => void;
};

export default function ImportPreview({ rows: initialRows, summary, onBack }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const toImportCount = rows.filter((r) => r.action === "import").length;

  function toggleAction(rowIndex: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.rowIndex === rowIndex
          ? { ...r, action: r.action === "import" ? "skip" : "import" }
          : r
      )
    );
  }

  function selectAll(action: "import" | "skip") {
    setRows((prev) =>
      prev.map((r) => (r.isValid ? { ...r, action } : r))
    );
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contacts/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore durante l'importazione");
        return;
      }
      setDone(data);
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-xl font-heading font-bold text-text">
          Importazione completata!
        </h2>
        <p className="text-text-muted">
          <strong>{done.imported}</strong> contatti importati ·{" "}
          <strong>{done.skipped}</strong> saltati
        </p>
        <button
          onClick={() => { router.push("/contatti"); router.refresh(); }}
          className="bg-brand hover:bg-brand-dark text-text font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          Vai ai contatti →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Totali" value={summary.total} color="bg-gray-50 text-text" />
        <SummaryCard label="Da importare" value={toImportCount} color="bg-green-50 text-green-700" />
        <SummaryCard label="Duplicati" value={summary.duplicates} color="bg-red-50 text-red-600" />
        <SummaryCard label="Non validi" value={summary.invalid} color="bg-gray-50 text-text-muted" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => selectAll("import")}
            className="text-xs font-semibold px-3 py-1.5 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
          >
            Seleziona tutti
          </button>
          <button
            onClick={() => selectAll("skip")}
            className="text-xs font-semibold px-3 py-1.5 border border-gray-200 text-text-muted rounded-lg hover:bg-gray-50 transition-colors"
          >
            Deseleziona tutti
          </button>
        </div>
        <p className="text-sm text-text-muted">
          {toImportCount} di {rows.filter((r) => r.isValid).length} selezionati
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Riga</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Telefono</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => {
                const isDuplicate = row.duplicates.length > 0;
                const isConflict = row.withinFileConflict;
                const isInvalid = !row.isValid;

                let rowBg = "";
                if (isInvalid) rowBg = "bg-gray-50 opacity-60";
                else if (isDuplicate) rowBg = "bg-red-50";
                else if (isConflict) rowBg = "bg-amber-50";
                else if (row.action === "import") rowBg = "bg-green-50";

                return (
                  <tr key={row.rowIndex} className={rowBg}>
                    <td className="px-4 py-2.5 text-text-muted text-xs">{row.rowIndex}</td>
                    <td className="px-4 py-2.5 font-medium text-text">
                      {row.first_name} {row.last_name}
                      {row.company && (
                        <span className="block text-xs text-text-muted">{row.company}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">{row.email ?? "—"}</td>
                    <td className="px-4 py-2.5 text-text-muted">{row.phone ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {isInvalid ? (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Non valido
                        </span>
                      ) : isDuplicate ? (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Duplicato
                        </span>
                      ) : isConflict ? (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Conflitto nel file
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {!isInvalid && (
                        <button
                          onClick={() => toggleAction(row.rowIndex)}
                          className="flex items-center gap-1.5 text-xs font-semibold"
                        >
                          {row.action === "import" ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-green-500" />
                              <span className="text-green-600">Importa</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                              <span className="text-text-muted">Salta</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Carica altro file
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading || toImportCount === 0}
          className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-text font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Importazione..." : `Importa ${toImportCount} contatti`}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg px-4 py-3 ${color}`}>
      <p className="text-2xl font-bold font-heading">{value}</p>
      <p className="text-xs mt-0.5">{label}</p>
    </div>
  );
}
