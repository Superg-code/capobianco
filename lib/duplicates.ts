import { supabase } from "./supabase";

export type DuplicateMatch = {
  type: "email" | "phone" | "both";
  existingContact: {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
};

export type ImportRow = {
  rowIndex: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  notes?: string;
};

export type ImportRowWithStatus = ImportRow & {
  duplicates: DuplicateMatch[];
  withinFileConflict: boolean;
  action: "import" | "skip";
  isValid: boolean;
};

export function normalizePhone(phone: string): string {
  return phone
    .replace(/[\s\-\(\)\.]/g, "")
    .replace(/^\+/, "")
    .replace(/^0039/, "39")
    .replace(/^39(?=\d{9,10}$)/, "")
    .replace(/^0/, "");
}

export async function checkSingleDuplicate(
  email?: string,
  phone?: string
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];

  if (email?.trim()) {
    const { data } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone")
      .ilike("email", email.trim())
      .maybeSingle();
    if (data) matches.push({ type: "email", existingContact: data as DuplicateMatch["existingContact"] });
  }

  if (phone?.trim()) {
    const normalized = normalizePhone(phone.trim());
    if (normalized.length >= 6) {
      const { data: allContacts } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email, phone")
        .not("phone", "is", null);

      for (const contact of allContacts ?? []) {
        if (contact.phone && normalizePhone(contact.phone) === normalized) {
          const existing = matches.find((m) => m.existingContact.id === contact.id);
          if (existing) {
            existing.type = "both";
          } else {
            matches.push({ type: "phone", existingContact: contact as DuplicateMatch["existingContact"] });
          }
          break;
        }
      }
    }
  }

  return matches;
}

export async function analyzeImportRows(rows: ImportRow[]): Promise<ImportRowWithStatus[]> {
  const emailsSeen = new Map<string, number>();
  const phonesSeen = new Map<string, number>();

  const results: ImportRowWithStatus[] = [];

  for (const row of rows) {
    const isValid = !!(row.first_name?.trim() || row.last_name?.trim());
    const dbDuplicates = isValid ? await checkSingleDuplicate(row.email, row.phone) : [];

    let withinFileConflict = false;

    if (row.email?.trim()) {
      const emailKey = row.email.trim().toLowerCase();
      if (emailsSeen.has(emailKey)) {
        withinFileConflict = true;
      } else {
        emailsSeen.set(emailKey, row.rowIndex);
      }
    }

    if (row.phone?.trim()) {
      const phoneKey = normalizePhone(row.phone.trim());
      if (phoneKey.length >= 6) {
        if (phonesSeen.has(phoneKey)) {
          withinFileConflict = true;
        } else {
          phonesSeen.set(phoneKey, row.rowIndex);
        }
      }
    }

    results.push({
      ...row,
      duplicates: dbDuplicates,
      withinFileConflict,
      isValid,
      action: !isValid || dbDuplicates.length > 0 || withinFileConflict ? "skip" : "import",
    });
  }

  return results;
}
