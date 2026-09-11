// PORTED FROM buzlee-app/src/features/admin-batch-upload/lib/csv.ts — keep in sync; see docs/admin-sync.md
/**
 * Minimal RFC 4180 CSV parser.
 *
 * Handles quoted fields (commas / newlines / escaped quotes inside quotes),
 * CRLF and LF line endings, and a UTF-8 BOM — the format Google Sheets
 * produces via File → Download → Comma Separated Values.
 */

export interface CsvDocument {
  headers: string[];
  /** Data rows keyed by normalized header name. */
  rows: Record<string, string>[];
}

/** Lowercase, trim, and snake_case a header so "Event Date" matches "event_date". */
export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  // Strip UTF-8 BOM
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  const pushField = () => {
    record.push(field);
    field = "";
  };
  const pushRecord = () => {
    pushField();
    records.push(record);
    record = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRecord();
    } else if (char === "\r") {
      if (input[i + 1] === "\n") i++;
      pushRecord();
    } else {
      field += char;
    }
  }

  // Final record (no trailing newline)
  if (field.length > 0 || record.length > 0) {
    pushRecord();
  }

  // Drop records that are entirely empty (blank trailing lines)
  return records.filter((r) => r.some((f) => f.trim().length > 0));
}

export function parseCsv(text: string): CsvDocument {
  const records = parseRecords(text);
  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = records[0].map(normalizeHeader);
  const rows = records.slice(1).map((record) => {
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      if (!header) return;
      row[header] = (record[i] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
}
