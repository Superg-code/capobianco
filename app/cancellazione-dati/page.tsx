export const metadata = {
  title: "Richiesta di cancellazione dati – Capobianco Group",
};

export default function CancellazioneDatiPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl w-full p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-xl">🚜</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Capobianco Group</h1>
            <p className="text-sm text-gray-500">Richiesta di cancellazione dati</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-800">Quali dati raccogliamo</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Capobianco Group raccoglie i seguenti dati nell'ambito delle attività commerciali e di assistenza clienti:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Nome e cognome</li>
            <li>Numero di telefono (WhatsApp)</li>
            <li>Indirizzo e-mail</li>
            <li>Azienda, città e provincia</li>
            <li>Storico delle comunicazioni WhatsApp</li>
            <li>Note commerciali e informazioni sull'interesse d'acquisto</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-gray-800">Come richiedere la cancellazione</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Per richiedere la cancellazione di tutti i tuoi dati personali dal nostro sistema, invia una e-mail a:
          </p>
          <a
            href="mailto:privacy@capobianco.it?subject=Richiesta%20cancellazione%20dati&body=Gentili%20Signori%2C%0A%0Arichiedo%20la%20cancellazione%20di%20tutti%20i%20miei%20dati%20personali.%0A%0ANome%3A%20%0ATelefono%3A%20%0A%0AGrazie."
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            privacy@capobianco.it
          </a>
          <p className="text-sm text-gray-500">
            Nella e-mail indica il tuo nome e numero di telefono. Elaboreremo la richiesta entro <strong>30 giorni</strong> come previsto dal GDPR (Reg. UE 2016/679).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-800">Cosa succede dopo la richiesta</h2>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Riceverai una conferma via e-mail entro 72 ore</li>
            <li>Tutti i tuoi dati personali verranno eliminati dal nostro CRM</li>
            <li>Lo storico delle conversazioni WhatsApp verrà rimosso</li>
            <li>Verranno conservati solo i dati obbligatori per legge (es. fatturazione)</li>
          </ul>
        </section>

        <hr className="border-gray-100" />

        <p className="text-xs text-gray-400 text-center">
          Capobianco Group · Via Esempio 1, Napoli · P.IVA 00000000000
        </p>
      </div>
    </main>
  );
}
