// PORTED FROM buzlee-app/src/entities/admin/lib/residents-csv.ts — keep in sync; see docs/admin-sync.md
// Web adaptation: `exportResidentsCsv` keeps only the app's web branch (Blob
// download); the expo-file-system / expo-sharing native branch is dropped.
import { downloadTextFile } from "@/shared/lib/download-file";
import type { AdminResidentSummary } from "../model/types";

/**
 * Columns follow the common email-marketing import shape (Mailchimp et al.):
 * email first, then name, then segmentation fields.
 */
const CSV_HEADERS = ["Email", "First Name", "Last Name", "Town", "Joined"];

/** RFC 4180: quote fields containing commas, quotes, or newlines; double quotes. */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Serialize residents to RFC 4180 CSV (CRLF line endings).
 * Email prefers the sign-in address, falling back to the profile contact email.
 */
export function buildResidentsCsv(residents: AdminResidentSummary[]): string {
  const rows = residents.map((resident) => [
    resident.email ?? resident.contact_email ?? "",
    resident.first_name ?? "",
    resident.last_name ?? "",
    resident.town_name ?? "",
    resident.created_at ? resident.created_at.slice(0, 10) : "",
  ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}

/**
 * Export residents as a CSV file download. BOM prefix so Excel detects UTF-8.
 */
export function exportResidentsCsv(residents: AdminResidentSummary[]): void {
  // Web fix: Blob download shared with the batch-upload templates.
  downloadTextFile(
    `buzlee-residents-${new Date().toISOString().slice(0, 10)}.csv`,
    buildResidentsCsv(residents),
  );
}
