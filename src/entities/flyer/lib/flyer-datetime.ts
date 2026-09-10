// PORTED FROM buzlee-app/src/entities/flyer/lib/flyer-datetime.ts — keep in sync; see docs/admin-sync.md
/**
 * Canonical date/time construction for flyer rows. Used by the flyer form and
 * the admin batch upload so both produce identical event_date / expires_at
 * values.
 *
 * Convention: event_date / event_end_date hold the user's local wall-clock
 * time as a naive timestamp. A midnight (T00:00) time part on event_end_date
 * is the "date-only" sentinel — the event runs through the end of that
 * calendar day (see hasFlyerEndTime in flyer-helper.ts).
 */

export function combineDateAndTime(date: string, time?: string): string {
  const eventTime = time || "00:00";
  return `${date}T${eventTime}:00`;
}

/**
 * expires_at = (end instant, or start instant when no end) + 1 day, as true UTC.
 * Accepts both naive strings (form/batch input) and stored timestamptz values
 * (which Supabase returns with a +00:00 suffix); the offset is stripped so the
 * wall-clock digits are always interpreted in the device's local timezone,
 * matching parseEventTimestamp's read-side convention.
 */
export function calculateExpiresAt(
  eventDateTime: string,
  eventEndDateTime: string | null,
): string {
  const raw = eventEndDateTime || eventDateTime;
  const naive = raw.replace(/[+-]\d{2}(:\d{2})?$/, "").replace(/Z$/, "");
  const expirationDate = new Date(naive);
  expirationDate.setDate(expirationDate.getDate() + 1);
  return expirationDate.toISOString();
}
