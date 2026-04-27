export const metadata = {
  title: "Informativa sulla Privacy – Capobianco Group",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-8">

        {/* Header */}
        <div className="border-b border-gray-100 pb-6">
          <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">Capobianco Group</p>
          <h1 className="text-2xl font-bold text-gray-900">Informativa sulla Privacy</h1>
          <p className="text-sm text-gray-500 mt-2">Ultimo aggiornamento: aprile 2025</p>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            La presente informativa è resa ai sensi del Regolamento (UE) 2016/679 («GDPR») e della normativa
            nazionale applicabile in materia di protezione dei dati personali, agli utenti che interagiscono
            con i servizi di Capobianco Group, incluso il sistema CRM interno e le comunicazioni tramite WhatsApp Business.
          </p>
        </div>

        {/* Sezione 1 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">1. Titolare del trattamento</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Il Titolare del trattamento è <strong>Capobianco Group S.r.l.</strong>, con sede legale in Napoli (NA),
            Italia. Per qualsiasi comunicazione relativa al trattamento dei dati personali è possibile contattarci
            all'indirizzo e-mail: <a href="mailto:privacy@capobianco.it" className="text-brand hover:underline">privacy@capobianco.it</a>.
          </p>
        </section>

        {/* Sezione 2 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">2. Tipologie di dati raccolti</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Nell'ambito dell'attività commerciale e di gestione clienti, Capobianco Group tratta le seguenti
            categorie di dati personali:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
            <li>Dati anagrafici: nome, cognome</li>
            <li>Dati di contatto: numero di telefono (anche WhatsApp), indirizzo e-mail</li>
            <li>Dati aziendali: ragione sociale, città, provincia di riferimento</li>
            <li>Dati commerciali: storico delle trattative, stato del pipeline di vendita, note operative</li>
            <li>Contenuto delle comunicazioni WhatsApp avviate tramite il sistema CRM</li>
            <li>Informazioni sull'interesse d'acquisto e sulla disponibilità economica, ove fornite volontariamente</li>
          </ul>
        </section>

        {/* Sezione 3 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">3. Finalità e base giuridica del trattamento</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Gestione del rapporto commerciale</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                I dati sono trattati per la gestione delle trattative commerciali, l'invio di comunicazioni
                relative a prodotti e servizi di interesse agricolo, e il supporto post-vendita.
                Base giuridica: <em>esecuzione di un contratto o misure precontrattuali</em> (art. 6, par. 1, lett. b GDPR)
                e <em>legittimo interesse</em> del Titolare (art. 6, par. 1, lett. f GDPR).
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Comunicazioni tramite WhatsApp Business</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Le conversazioni avviate tramite WhatsApp Business sono condotte previo consenso esplicito
                dell'interessato e finalizzate all'assistenza commerciale e alla proposta di soluzioni
                per l'attività agricola.
                Base giuridica: <em>consenso dell'interessato</em> (art. 6, par. 1, lett. a GDPR).
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Obblighi di legge</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Alcuni dati (es. dati fiscali e contabili) possono essere trattati per adempiere a obblighi
                di legge previsti dalla normativa civile e fiscale.
                Base giuridica: <em>obbligo legale</em> (art. 6, par. 1, lett. c GDPR).
              </p>
            </div>
          </div>
        </section>

        {/* Sezione 4 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">4. Modalità e periodo di conservazione</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            I dati personali sono trattati con strumenti informatici, nel rispetto dei principi di liceità,
            correttezza, trasparenza, minimizzazione e sicurezza previsti dal GDPR. I dati sono conservati
            per il tempo strettamente necessario al conseguimento delle finalità per cui sono stati raccolti,
            e comunque non oltre <strong>5 anni</strong> dall'ultima interazione commerciale, salvo obblighi
            di conservazione più lunghi previsti dalla legge (es. 10 anni per la documentazione fiscale).
          </p>
        </section>

        {/* Sezione 5 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">5. Destinatari dei dati</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            I dati personali non sono diffusi né ceduti a terzi per finalità commerciali. Possono essere
            comunicati, nella misura strettamente necessaria, a:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
            <li>Fornitori di servizi tecnologici che trattano i dati in qualità di responsabili del trattamento (es. Supabase per il database, Meta/WhatsApp Business API per la messaggistica, Vercel per l'hosting)</li>
            <li>Collaboratori e dipendenti autorizzati di Capobianco Group, nei limiti delle rispettive mansioni</li>
            <li>Autorità pubbliche, ove richiesto dalla legge</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            I fornitori di servizi tecnologici possono operare al di fuori dell'Unione Europea; in tal caso,
            il trasferimento avviene nel rispetto delle garanzie previste dal GDPR (Capitolo V).
          </p>
        </section>

        {/* Sezione 6 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">6. Diritti degli interessati</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Ai sensi degli artt. 15–22 del GDPR, l'interessato ha diritto di:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
            <li><strong>Accesso</strong>: ottenere conferma del trattamento e copia dei dati personali</li>
            <li><strong>Rettifica</strong>: correggere dati inesatti o incompleti</li>
            <li><strong>Cancellazione</strong>: ottenere la cancellazione dei dati («diritto all'oblio»)</li>
            <li><strong>Limitazione</strong>: richiedere la limitazione del trattamento in determinati casi</li>
            <li><strong>Portabilità</strong>: ricevere i propri dati in formato strutturato e leggibile</li>
            <li><strong>Opposizione</strong>: opporsi al trattamento basato sul legittimo interesse</li>
            <li><strong>Revoca del consenso</strong>: revocare in qualsiasi momento il consenso prestato</li>
          </ul>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            Per esercitare i propri diritti è sufficiente inviare una richiesta a{" "}
            <a href="mailto:privacy@capobianco.it" className="text-brand hover:underline">privacy@capobianco.it</a>.
            La risposta verrà fornita entro 30 giorni dalla ricezione della richiesta.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            L'interessato ha inoltre il diritto di proporre reclamo al{" "}
            <strong>Garante per la protezione dei dati personali</strong> (www.garanteprivacy.it).
          </p>
        </section>

        {/* Sezione 7 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">7. Sicurezza dei dati</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Capobianco Group adotta misure tecniche e organizzative adeguate a garantire un livello di
            sicurezza appropriato al rischio, tra cui: autenticazione con credenziali sicure, cifratura
            delle comunicazioni (TLS/HTTPS), accesso ai dati limitato al personale autorizzato e
            infrastruttura cloud certificata.
          </p>
        </section>

        {/* Sezione 8 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-800">8. Modifiche alla presente informativa</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Il Titolare si riserva il diritto di modificare la presente informativa in qualsiasi momento,
            dandone comunicazione agli interessati tramite aggiornamento della data in calce al documento.
            Si consiglia di consultare periodicamente questa pagina.
          </p>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <p className="text-xs text-gray-400">
              Capobianco Group S.r.l. · Napoli, Italia · privacy@capobianco.it
            </p>
            <a
              href="/cancellazione-dati"
              className="text-xs text-brand hover:underline"
            >
              Richiedi cancellazione dati →
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
