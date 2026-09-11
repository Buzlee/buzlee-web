// PORTED FROM buzlee-app/src/features/admin-batch-upload/lib/batch-row-schemas.ts — keep in sync; see docs/admin-sync.md
import { z } from "zod";
import { parseAgeRestriction } from "@/entities/flyer/lib/age-restriction";

/**
 * Row schemas for the admin batch-upload CSV templates.
 *
 * Column names here are the single source of truth — the CSV templates in
 * docs/batch-upload/ and the header validation below both derive from them.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const URL_REGEX = /^https?:\/\/\S+$/i;

/** Empty CSV cells become undefined so .optional() works naturally. */
const optionalCell = z
  .string()
  .transform((v) => (v.trim() === "" ? undefined : v.trim()));

const requiredCell = (label: string) =>
  z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, `${label} is required`);

const optionalUrl = (label: string) =>
  optionalCell.refine(
    (v) => v === undefined || URL_REGEX.test(v),
    `${label} must be an http(s) URL`,
  );

const optionalCoordinate = (label: string, min: number, max: number) =>
  optionalCell
    .refine(
      (v) => v === undefined || !Number.isNaN(Number(v)),
      `${label} must be a number`,
    )
    .transform((v) => (v === undefined ? undefined : Number(v)))
    .refine(
      (v) => v === undefined || (v >= min && v <= max),
      `${label} must be between ${min} and ${max}`,
    );

function isRealDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

const dateCell = (label: string) =>
  requiredCell(label).refine(
    (v) => DATE_REGEX.test(v) && isRealDate(v),
    `${label} must be a valid date in YYYY-MM-DD format`,
  );

const optionalDateCell = (label: string) =>
  optionalCell.refine(
    (v) => v === undefined || (DATE_REGEX.test(v) && isRealDate(v)),
    `${label} must be a valid date in YYYY-MM-DD format`,
  );

const optionalTimeCell = (label: string) =>
  optionalCell.refine(
    (v) => v === undefined || TIME_REGEX.test(v),
    `${label} must be a 24-hour time in HH:MM format`,
  );

export const flyerRowSchema = z
  .object({
    business_name: requiredCell("business_name"),
    title: requiredCell("title"),
    description: optionalCell,
    category: requiredCell("category"),
    event_date: dateCell("event_date"),
    event_time: optionalTimeCell("event_time"),
    event_end_date: optionalDateCell("event_end_date"),
    event_end_time: optionalTimeCell("event_end_time"),
    location_name: optionalCell,
    location_address: requiredCell("location_address"),
    town: optionalCell,
    latitude: optionalCoordinate("latitude", -90, 90),
    longitude: optionalCoordinate("longitude", -180, 180),
    media_url: requiredCell("media_url").refine(
      (v) => URL_REGEX.test(v),
      "media_url must be an http(s) URL",
    ),
    cover_photo_url: optionalUrl("cover_photo_url"),
    external_link: optionalUrl("external_link"),
    age_restriction: optionalCell
      .refine(
        (v) => v === undefined || parseAgeRestriction(v) !== null,
        "age_restriction must be an age or range up to 100 years, like '21', '6mo' or '6mo-12yr'",
      )
      // Web fix: `?? undefined` instead of `!` — unreachable null (the refine
      // above already rejected it) without a non-null assertion.
      .transform((v) =>
        v === undefined ? undefined : (parseAgeRestriction(v) ?? undefined),
      ),
    visibility: optionalCell
      .refine(
        (v) => v === undefined || v === "public" || v === "members_only",
        "visibility must be 'public' or 'members_only'",
      )
      .transform(
        (v) =>
          (v === "members_only" ? "members_only" : "public") as
            | "public"
            | "members_only",
      ),
    status: optionalCell
      .refine(
        (v) => v === undefined || v === "live" || v === "draft",
        "status must be 'live' or 'draft'",
      )
      .transform((v) => (v === "draft" ? "draft" : "live") as "live" | "draft"),
    tags: optionalCell.transform((v) =>
      v === undefined
        ? []
        : v
            .split(";")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
    ),
  })
  .superRefine((row, ctx) => {
    if ((row.latitude === undefined) !== (row.longitude === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "latitude and longitude must be provided together",
      });
    }
    if (row.event_end_date) {
      const start = `${row.event_date}T${row.event_time ?? "00:00"}`;
      const end = `${row.event_end_date}T${row.event_end_time ?? "00:00"}`;
      if (end < start) {
        ctx.addIssue({
          code: "custom",
          message:
            "event_end_date/event_end_time must not be before event_date/event_time",
        });
      }
    }
  });

export type FlyerRow = z.infer<typeof flyerRowSchema>;

export const businessRowSchema = z
  .object({
    name: requiredCell("name"),
    email: optionalCell.refine(
      (v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "email must be a valid email address",
    ),
    category: requiredCell("category"),
    phone: optionalCell,
    website: optionalUrl("website"),
    address: optionalCell,
    town: optionalCell,
    latitude: optionalCoordinate("latitude", -90, 90),
    longitude: optionalCoordinate("longitude", -180, 180),
    description: optionalCell,
  })
  .superRefine((row, ctx) => {
    if ((row.latitude === undefined) !== (row.longitude === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "latitude and longitude must be provided together",
      });
    }
  });

export type BusinessRow = z.infer<typeof businessRowSchema>;

export const FLYER_REQUIRED_HEADERS = [
  "business_name",
  "title",
  "category",
  "event_date",
  "location_address",
  "media_url",
] as const;

export const BUSINESS_REQUIRED_HEADERS = ["name", "category"] as const;

export interface RowError {
  /** 1-based row number as seen in the spreadsheet (header = row 1). */
  rowNumber: number;
  message: string;
}

export function validateHeaders(
  headers: string[],
  required: readonly string[],
): string | null {
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return `CSV is missing required column(s): ${missing.join(", ")}. Use the provided template.`;
  }
  return null;
}

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
