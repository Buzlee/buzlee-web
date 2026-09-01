// PORTED FROM buzlee-app/src/entities/admin/model/moderation.ts — keep in sync; see docs/admin-sync.md
/**
 * Moderation constants shared by admin screens (mobile) and mirrored on web.
 *
 * Quick-pick reasons keep the copy owners receive consistent and cut the
 * per-decision typing an admin does (Screens - Admin v2). "Other" requires a
 * typed detail in the ReasonSheet.
 */

/** Days a soft-deleted entity is restorable before the daily purge removes it. */
export const DELETE_RETENTION_DAYS = 15;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Date the retention window ends for a soft-deleted row. */
export function purgeDate(deletedAt: string): Date {
  return new Date(
    new Date(deletedAt).getTime() + DELETE_RETENTION_DAYS * DAY_MS,
  );
}

/** Locale date string for the end of the retention window. */
export function purgeDateLabel(deletedAt: string): string {
  return purgeDate(deletedAt).toLocaleDateString();
}

/** Whole days (>= 0) until a soft-deleted row is purged. */
export function daysUntilPurge(
  deletedAt: string,
  now: Date = new Date(),
): number {
  return Math.max(
    0,
    Math.ceil((purgeDate(deletedAt).getTime() - now.getTime()) / DAY_MS),
  );
}

/** Quick-pick reasons for rejecting a business listing. */
export const REJECT_REASONS = [
  "Duplicate listing",
  "Not a real business",
  "Missing or wrong info",
  "Prohibited content",
  "Other",
] as const;

/** Quick-pick reasons for taking down a live flyer. */
export const FLYER_TAKEDOWN_REASONS = [
  "Misleading or spam",
  "Prohibited content",
  "Wrong or expired event info",
  "Not from this business",
  "Other",
] as const;
