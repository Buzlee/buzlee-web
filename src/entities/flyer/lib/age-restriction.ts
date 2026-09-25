// PORTED FROM buzlee-app/src/entities/flyer/lib/age-restriction.ts — keep in sync; see docs/admin-sync.md
import type { Flyer } from "../model/types";

export type AgeUnit = "months" | "years";

/** Max supported age in months (100 years). */
export const MAX_AGE_MONTHS = 1200;

export function ageToMonths(value: number, unit: AgeUnit): number {
  return unit === "years" ? value * 12 : value;
}

/**
 * Split stored months back into the friendliest input value + unit
 * (whole years hydrate as years, anything else as months).
 */
export function monthsToAgeInput(months: number): {
  value: number;
  unit: AgeUnit;
} {
  return months % 12 === 0
    ? { value: months / 12, unit: "years" }
    : { value: months, unit: "months" };
}

function formatBound(months: number, withYearSuffix: boolean): string {
  if (months % 12 !== 0) return `${months}mo`;
  return withYearSuffix ? `${months / 12}yr` : `${months / 12}`;
}

/**
 * Compact display label for an age range, sized for chips:
 * min only → "21+" / "6mo+", range → "6mo–12yr" / "5–12yr",
 * max only → "0–12yr". Returns null when no restriction is set.
 */
export function formatAgeRestriction(
  minMonths: number | null,
  maxMonths: number | null,
): string | null {
  if (minMonths == null && maxMonths == null) return null;
  // Web fix: `minMonths!` → `?? 0` (repo lints noNonNullAssertion; unreachable when both are null).
  if (maxMonths == null) return `${formatBound(minMonths ?? 0, false)}+`;
  return `${formatBound(minMonths ?? 0, false)}–${formatBound(maxMonths, true)}`;
}

/**
 * Age range for a flyer, falling back to the legacy years-based
 * `age_restriction` column for rows that predate the range columns.
 */
export function getFlyerAgeRange(
  flyer: Pick<Flyer, "age_restriction"> &
    Partial<Pick<Flyer, "age_min_months" | "age_max_months">>,
): { minMonths: number | null; maxMonths: number | null } | null {
  const minMonths =
    flyer.age_min_months ??
    (flyer.age_restriction != null ? flyer.age_restriction * 12 : null);
  const maxMonths = flyer.age_max_months ?? null;
  if (minMonths == null && maxMonths == null) return null;
  return { minMonths, maxMonths };
}

/** Display label for a flyer's age restriction, or null when unrestricted. */
export function formatFlyerAgeRestriction(
  flyer: Parameters<typeof getFlyerAgeRange>[0],
): string | null {
  const range = getFlyerAgeRange(flyer);
  return range ? formatAgeRestriction(range.minMonths, range.maxMonths) : null;
}

const AGE_BOUND_REGEX = /^(\d+)\s*(mo|months?|yrs?|years?)?$/i;

function parseBound(raw: string): number | null {
  const match = raw.trim().match(AGE_BOUND_REGEX);
  if (!match) return null;
  const unit: AgeUnit = match[2]?.toLowerCase().startsWith("mo")
    ? "months"
    : "years";
  const months = ageToMonths(parseInt(match[1], 10), unit);
  return months <= MAX_AGE_MONTHS ? months : null;
}

/**
 * Parse a free-form age restriction cell ("21", "6mo", "6mo-12yr", "5-12")
 * into months. Bare numbers are years. Returns null on invalid input.
 */
export function parseAgeRestriction(
  raw: string,
): { minMonths: number; maxMonths: number | null } | null {
  const parts = raw.split(/[-–]/);
  if (parts.length > 2) return null;
  const minMonths = parseBound(parts[0]);
  if (minMonths == null) return null;
  if (parts.length === 1) return { minMonths, maxMonths: null };
  const maxMonths = parseBound(parts[1]);
  if (maxMonths == null || maxMonths < minMonths) return null;
  return { minMonths, maxMonths };
}
