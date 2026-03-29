"use client";

import { useState } from "react";
import { Trophy, Medal } from "lucide-react";

type Row = {
  id: number;
  name: string;
  vendite_vinte: number;
  valore_totale: number;
  trattative_totali: number;
  chiuse: number;
  tasso_conversione: number | null;
};

type Props = {
  initialRows: Row[];
};

const PERIODS = [
  { value: "all", label: "Tutto" },
  { value: "year", label: "Quest'anno" },
  { value: "quarter", label: "Trimestre" },
  { value: "month", label: "Questo mese" },
];

function formatEuro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function LeaderboardClient({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(false);

  async function handlePeriodChange(newPeriod: string) {
    setPeriod(newPeriod);
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${newPeriod}`);
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch {
      // keep existing rows
    } finally {
      setLoading(false);
    }
  }

  const topSales = rows.reduce((sum, r) => sum + r.vendite_vinte, 0);
  const topValue = rows.reduce((sum, r) => sum + r.valore_totale, 0);

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
  const medalBg = ["bg-yellow-50 border-yellow-200", "bg-gray-50 border-gray-200", "bg-amber-50 border-amber-200"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">Classifica venditori</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {topSales} vendite vinte · {formatEuro(topValue)} di valore
          </p>
        </div>
        {/* Period filter */}
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                period === p.value
                  ? "bg-brand text-text"
                  : "text-text-muted hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {rows.slice(0, 3).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rows.slice(0, 3).map((row, idx) => (
            <div
              key={row.id}
              className={`border rounded-xl p-5 text-center ${medalBg[idx] ?? "bg-white border-gray-100"}`}
            >
              <div className="flex justify-center mb-2">
                {idx === 0 ? (
                  <Trophy className={`w-8 h-8 ${medalColors[0]}`} />
                ) : (
                  <Medal className={`w-7 h-7 ${medalColors[idx]}`} />
                )}
              </div>
              <p className="font-heading font-bold text-text text-lg leading-tight">
                {row.name}
              </p>
              <p className="text-3xl font-bold font-heading text-text mt-2">
                {row.vendite_vinte}
              </p>
              <p className="text-xs text-text-muted">vendite vinte</p>
              <p className="text-sm font-semibold text-text mt-1">
                {formatEuro(row.valore_totale)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Full table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className={`transition-opacity ${loading ? "opacity-40 pointer-events-none" : ""}`}>
          {rows.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted text-sm">Nessun dato disponibile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">#</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-text-muted uppercase">Venditore</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-text-muted uppercase">Vendite vinte</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-text-muted uppercase">Valore totale</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-text-muted uppercase">Trattative</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-text-muted uppercase">Conv. %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, idx) => (
                    <tr key={row.id} className={`${idx < 3 ? "bg-brand/5" : ""} hover:bg-gray-50 transition-colors`}>
                      <td className="px-5 py-3.5">
                        <span className={`font-bold text-sm ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-text-muted"}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-brand/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-brand-dark">
                              {row.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-semibold text-text text-sm">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold text-text text-lg">{row.vendite_vinte}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-text">
                        {formatEuro(row.valore_totale)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-text-muted">
                        {row.trattative_totali}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {row.tasso_conversione != null ? (
                          <span className={`text-sm font-semibold ${row.tasso_conversione >= 50 ? "text-green-600" : row.tasso_conversione >= 25 ? "text-amber-600" : "text-red-500"}`}>
                            {row.tasso_conversione}%
                          </span>
                        ) : (
                          <span className="text-text-muted text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
