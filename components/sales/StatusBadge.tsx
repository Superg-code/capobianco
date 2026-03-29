const STATUS_CONFIG = {
  lead: { label: "Lead", color: "bg-slate-100 text-slate-600" },
  prospect: { label: "Prospect", color: "bg-blue-100 text-blue-700" },
  trattativa: { label: "Trattativa", color: "bg-amber-100 text-amber-700" },
  vinto: { label: "Vinto", color: "bg-green-100 text-green-700" },
  perso: { label: "Perso", color: "bg-red-100 text-red-700" },
};

export type SaleStatus = keyof typeof STATUS_CONFIG;

export const STATUSES = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value: value as SaleStatus,
  label,
}));

type Props = {
  status: string;
  size?: "sm" | "md";
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const config = STATUS_CONFIG[status as SaleStatus] ?? {
    label: status,
    color: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${config.color} ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1"
      }`}
    >
      {config.label}
    </span>
  );
}
