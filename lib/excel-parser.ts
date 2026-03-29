import * as XLSX from "xlsx";
import type { ImportRow } from "./duplicates";

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  nome: "first_name",
  "first name": "first_name",
  firstname: "first_name",
  cognome: "last_name",
  "last name": "last_name",
  lastname: "last_name",
  surname: "last_name",
  email: "email",
  "e-mail": "email",
  "e mail": "email",
  mail: "email",
  telefono: "phone",
  tel: "phone",
  cellulare: "phone",
  mobile: "phone",
  phone: "phone",
  "phone number": "phone",
  azienda: "company",
  società: "company",
  societa: "company",
  company: "company",
  aziende: "company",
  città: "city",
  citta: "city",
  city: "city",
  comune: "city",
  localita: "city",
  località: "city",
  note: "notes",
  notes: "notes",
  annotazioni: "notes",
  commenti: "notes",
};

export function parseExcelBuffer(buffer: Buffer): ImportRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length === 0) return [];

  // Map header keys to our field names
  const headerMap: Record<string, keyof ImportRow> = {};
  const firstRow = rawRows[0];
  for (const key of Object.keys(firstRow)) {
    const normalized = key.toLowerCase().trim();
    if (COLUMN_MAP[normalized]) {
      headerMap[key] = COLUMN_MAP[normalized];
    }
  }

  return rawRows
    .map((row, index) => {
      const mapped: Partial<ImportRow> & { rowIndex: number } = {
        rowIndex: index + 2, // +2 because row 1 is header, index 0 = row 2
      };

      for (const [key, field] of Object.entries(headerMap)) {
        const value = String(row[key] ?? "").trim();
        if (value) {
          (mapped as Record<string, unknown>)[field] = value;
        }
      }

      // Ensure first_name and last_name exist (even if empty string)
      mapped.first_name = mapped.first_name ?? "";
      mapped.last_name = mapped.last_name ?? "";

      return mapped as ImportRow;
    })
    .filter(
      (row) =>
        // Filter completely empty rows
        row.first_name ||
        row.last_name ||
        row.email ||
        row.phone ||
        row.company
    );
}
