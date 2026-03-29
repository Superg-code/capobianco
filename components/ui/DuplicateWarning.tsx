import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { DuplicateMatch } from "@/lib/duplicates";

type Props = {
  duplicates: DuplicateMatch[];
};

export default function DuplicateWarning({ duplicates }: Props) {
  if (duplicates.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-amber-800">Possibile duplicato trovato</p>
        <ul className="mt-1 space-y-0.5">
          {duplicates.map((d) => (
            <li key={d.existingContact.id} className="text-amber-700">
              {d.type === "email" ? "Stessa email" : d.type === "phone" ? "Stesso telefono" : "Stessa email e telefono"}:{" "}
              <Link
                href={`/contatti/${d.existingContact.id}`}
                className="font-semibold underline hover:text-amber-900"
              >
                {d.existingContact.first_name} {d.existingContact.last_name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
