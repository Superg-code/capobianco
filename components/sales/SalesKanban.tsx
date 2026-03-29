"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Euro, Building2 } from "lucide-react";
import type { SaleStatus } from "./StatusBadge";

const COLUMNS: { status: SaleStatus; label: string; color: string; headerColor: string }[] = [
  { status: "lead", label: "Lead", color: "bg-slate-50 border-slate-200", headerColor: "bg-slate-100 text-slate-700" },
  { status: "prospect", label: "Prospect", color: "bg-blue-50 border-blue-200", headerColor: "bg-blue-100 text-blue-700" },
  { status: "trattativa", label: "Trattativa", color: "bg-amber-50 border-amber-200", headerColor: "bg-amber-100 text-amber-700" },
  { status: "vinto", label: "Vinto", color: "bg-green-50 border-green-200", headerColor: "bg-green-100 text-green-700" },
  { status: "perso", label: "Perso", color: "bg-red-50 border-red-200", headerColor: "bg-red-100 text-red-700" },
];

type Sale = {
  id: number;
  contact_id: number;
  status: string;
  product: string | null;
  value: number | null;
  first_name: string;
  last_name: string;
  company: string | null;
  salesperson_name: string;
};

type Props = {
  sales: Sale[];
};

export default function SalesKanban({ sales: initialSales }: Props) {
  const router = useRouter();
  const [sales, setSales] = useState(initialSales);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<SaleStatus | null>(null);
  const [, startTransition] = useTransition();

  function handleDragStart(e: React.DragEvent, saleId: number) {
    setDraggingId(saleId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, status: SaleStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e: React.DragEvent, newStatus: SaleStatus) {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggingId == null) return;

    const sale = sales.find((s) => s.id === draggingId);
    if (!sale || sale.status === newStatus) return;

    // Optimistic update
    setSales((prev) =>
      prev.map((s) => (s.id === draggingId ? { ...s, status: newStatus } : s))
    );

    try {
      const res = await fetch(`/api/sales/${draggingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        setSales((prev) =>
          prev.map((s) => (s.id === draggingId ? { ...s, status: sale.status } : s))
        );
      }
    } catch {
      // Revert
      setSales((prev) =>
        prev.map((s) => (s.id === draggingId ? { ...s, status: sale.status } : s))
      );
    }

    setDraggingId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {COLUMNS.map((col) => {
        const colSales = sales.filter((s) => s.status === col.status);
        const isDragOver = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            className={`flex-shrink-0 w-64 rounded-xl border-2 transition-colors ${col.color} ${
              isDragOver ? "border-brand shadow-lg" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            {/* Column header */}
            <div className={`px-3 py-2.5 rounded-t-xl flex items-center justify-between ${col.headerColor}`}>
              <span className="font-heading font-bold text-sm">{col.label}</span>
              <span className="text-xs font-bold bg-white/60 rounded-full w-6 h-6 flex items-center justify-center">
                {colSales.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {colSales.map((sale) => (
                <div
                  key={sale.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, sale.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`bg-white rounded-lg border border-gray-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
                    draggingId === sale.id ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <Link
                    href={`/contatti/${sale.contact_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block"
                  >
                    <p className="font-semibold text-text text-sm leading-tight">
                      {sale.first_name} {sale.last_name}
                    </p>
                    {sale.company && (
                      <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {sale.company}
                      </p>
                    )}
                  </Link>

                  {sale.product && (
                    <p className="text-xs text-text-muted mt-1.5 bg-gray-50 rounded px-2 py-0.5">
                      {sale.product}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    {sale.value != null ? (
                      <span className="text-xs font-bold text-text flex items-center gap-0.5">
                        <Euro className="w-3 h-3" />
                        {new Intl.NumberFormat("it-IT").format(sale.value)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-text-muted bg-gray-100 rounded-full px-2 py-0.5">
                      {sale.salesperson_name.split(" ")[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
