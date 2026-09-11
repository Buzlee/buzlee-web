// PORTED FROM buzlee-app/src/features/admin-batch-upload/ui/row-field-defs.ts — keep in sync; see docs/admin-sync.md
// Web adaptation: RN `keyboardType` / `autoCapitalize` become the HTML
// `inputMode` / `type` attributes that drive the same on-screen keyboards.
import type { BatchType } from "../model/use-batch-upload";

/**
 * Presentation config for one CSV column: drives both the read-only field
 * list on the review card and the inputs in the row edit sheet. Keys match
 * the CSV template columns, which are the single source of truth in
 * lib/batch-row-schemas.ts.
 */
export interface RowFieldDef {
  key: string;
  label: string;
  required?: boolean;
  kind?: "text" | "multiline" | "chips";
  /** For `chips`: first option is the default the schema falls back to when the cell is empty. */
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  inputType?: "text" | "url" | "email" | "tel";
  inputMode?: "text" | "decimal" | "url" | "email" | "tel";
}

const FLYER_FIELD_DEFS: RowFieldDef[] = [
  { key: "title", label: "Title", required: true },
  {
    key: "business_name",
    label: "Business",
    required: true,
    description: "Must match an approved business exactly.",
  },
  {
    key: "category",
    label: "Category",
    required: true,
    description: "Must match an existing flyer category.",
  },
  {
    key: "event_date",
    label: "Event date",
    required: true,
    placeholder: "YYYY-MM-DD",
  },
  { key: "event_time", label: "Event time", placeholder: "HH:MM (24-hour)" },
  { key: "event_end_date", label: "End date", placeholder: "YYYY-MM-DD" },
  { key: "event_end_time", label: "End time", placeholder: "HH:MM (24-hour)" },
  { key: "location_name", label: "Location name" },
  { key: "location_address", label: "Address", required: true },
  { key: "town", label: "Town", description: "Left blank if no town matches." },
  { key: "latitude", label: "Latitude", inputMode: "decimal" },
  { key: "longitude", label: "Longitude", inputMode: "decimal" },
  {
    key: "media_url",
    label: "Media URL",
    required: true,
    inputType: "url",
    inputMode: "url",
  },
  {
    key: "cover_photo_url",
    label: "Cover photo URL",
    inputType: "url",
    inputMode: "url",
  },
  {
    key: "external_link",
    label: "External link",
    inputType: "url",
    inputMode: "url",
  },
  {
    key: "age_restriction",
    label: "Age restriction",
    placeholder: "e.g. 21 or 6mo-12yr",
  },
  {
    key: "visibility",
    label: "Visibility",
    kind: "chips",
    options: [
      { value: "public", label: "Public" },
      { value: "members_only", label: "Members only" },
    ],
  },
  {
    key: "status",
    label: "Status",
    kind: "chips",
    options: [
      { value: "live", label: "Live" },
      { value: "draft", label: "Draft" },
    ],
  },
  {
    key: "tags",
    label: "Tags",
    description: "Separate multiple tags with semicolons.",
  },
  { key: "description", label: "Description", kind: "multiline" },
];

const BUSINESS_FIELD_DEFS: RowFieldDef[] = [
  { key: "name", label: "Name", required: true },
  {
    key: "category",
    label: "Category",
    required: true,
    description: "Must match an existing business category.",
  },
  { key: "email", label: "Email", inputType: "email", inputMode: "email" },
  { key: "phone", label: "Phone", inputType: "tel", inputMode: "tel" },
  { key: "website", label: "Website", inputType: "url", inputMode: "url" },
  { key: "address", label: "Address" },
  { key: "town", label: "Town", description: "Left blank if no town matches." },
  { key: "latitude", label: "Latitude", inputMode: "decimal" },
  { key: "longitude", label: "Longitude", inputMode: "decimal" },
  { key: "description", label: "Description", kind: "multiline" },
];

export const FIELD_DEFS: Record<BatchType, RowFieldDef[]> = {
  flyers: FLYER_FIELD_DEFS,
  businesses: BUSINESS_FIELD_DEFS,
};
