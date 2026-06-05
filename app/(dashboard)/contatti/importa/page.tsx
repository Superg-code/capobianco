"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet, Folder } from "lucide-react";
import ImportPreview from "@/components/contacts/ImportPreview";
import type { ImportRowWithStatus } from "@/lib/duplicates";

type PreviewData = {
  rows: ImportRowWithStatus[];
  summary: {
    total: number;
    toImport: number;
    toSkip: number;
    duplicates: number;
    withinFile: number;
    invalid: number;
  };
};

type FolderItem = { id: number; name: string };

export default function ImportaPage() {
  const searchParams = useSearchParams();
  const preselectedFolder = searchParams.get("folder");

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(preselectedFolder ?? "");

  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((d) => setFolders(d.folders ?? []));
  }, []);

  async function handleFile(file: File) {
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/contacts/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Errore durante il caricamento");
        return;
      }
      setPreview(data);
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/contatti"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-text-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-text">
            Importa da Excel
          </h1>
          <p className="text-text-muted text-sm">
            Carica un file .xlsx o .xls con i tuoi contatti
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {preview ? (
          <ImportPreview
            rows={preview.rows}
            summary={preview.summary}
            folderId={selectedFolderId ? Number(selectedFolderId) : null}
            onBack={() => setPreview(null)}
          />
        ) : (
          <div className="space-y-6">
            {/* Selezione cartella */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-brand-dark" />
                  Importa in cartella (opzionale)
                </span>
              </label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
              >
                <option value="">Nessuna cartella</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              {!folders.length && (
                <p className="text-xs text-text-muted mt-1">
                  Nessuna cartella ancora.{" "}
                  <Link href="/contatti" className="text-brand-dark hover:underline">Creane una</Link>{" "}
                  dalla sezione Contatti prima di importare.
                </p>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragging
                  ? "border-brand bg-brand/5"
                  : "border-gray-200 hover:border-brand/50"
              }`}
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-text-muted text-sm">Analisi del file in corso...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto" />
                  <div>
                    <p className="font-semibold text-text">
                      Trascina il file qui
                    </p>
                    <p className="text-text-muted text-sm mt-1">
                      oppure clicca per selezionarlo
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-text font-semibold text-sm px-5 py-2.5 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    Scegli file
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-text-muted">
                    Formati supportati: .xlsx, .xls
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Column guide */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-heading font-bold text-text mb-3 text-sm">
                Colonne riconosciute
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  ["Nome / First Name", "first_name"],
                  ["Cognome / Last Name", "last_name"],
                  ["Email / E-mail", "email"],
                  ["Telefono / Cellulare", "phone"],
                  ["Azienda / Società", "company"],
                  ["Città / Comune", "city"],
                  ["Note / Annotazioni", "notes"],
                ].map(([label, field]) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                    <span className="text-xs text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
