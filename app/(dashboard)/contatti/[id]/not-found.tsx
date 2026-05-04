import Link from "next/link";
import { ArrowLeft, UserX } from "lucide-react";

export default function ContactNotFound() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/contatti" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-heading font-bold text-text">Contatto non trovato</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center gap-4 text-center">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center">
          <UserX className="w-8 h-8 text-text-muted" />
        </div>
        <div>
          <p className="font-semibold text-text">Questo contatto non esiste</p>
          <p className="text-sm text-text-muted mt-1">Potrebbe essere stato eliminato o il link non è valido.</p>
        </div>
        <Link
          href="/contatti"
          className="mt-2 px-4 py-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm rounded-lg transition-colors"
        >
          Torna ai contatti
        </Link>
      </div>
    </div>
  );
}
