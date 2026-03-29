import ContactForm from "@/components/contacts/ContactForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuovoContattoPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/contatti"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">
            Nuovo contatto
          </h1>
          <p className="text-text-muted text-sm">Aggiungi un nuovo lead o contatto commerciale</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <ContactForm />
      </div>
    </div>
  );
}
