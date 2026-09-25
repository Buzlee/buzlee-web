// PORTED FROM buzlee-app/src/shared/lib/date-local.ts — keep in sync; see docs/admin-sync.md
/**
 * @module shared/lib/date-local
 *
 * Local-calendar date helpers for `YYYY-MM-DD` strings. The app stores and
 * displays wall-clock dates in the device's local timezone; these helpers
 * avoid the UTC-midnight interpretation that `new Date('2026-03-15')` uses
 * (which shifts the displayed day backwards in US timezones).
 */

/** Parse a `YYYY-MM-DD` string as a local-timezone Date at midnight. */
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Format a Date to `YYYY-MM-DD` using local date components. */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM` key for a Date (local). */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Add whole days in local time (DST-safe: uses setDate). */
export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Add whole months, clamping the day to the target month's length
 * (Jan 31 + 1 month → Feb 28/29). Keeps the time-of-day.
 */
export function addMonthsLocal(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(
    year,
    month,
    Math.min(date.getDate(), lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

/** Midnight at the start of the local calendar day. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Last millisecond of the local calendar day. */
export function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

/** True when both Dates fall on the same local calendar day. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Days shown by a month-grid calendar: leading days from the previous month
 * so the grid starts on `weekStartsOn`, every day of the month, then trailing
 * days to fill complete weeks. Returns local-midnight Dates.
 */
export function daysInMonthGrid(
  month: string,
  weekStartsOn: 0 | 1 = 0,
): Date[] {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(year, monthIndex - 1, 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const gridStart = addDaysLocal(first, -lead);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  return Array.from({ length: total }, (_, i) => addDaysLocal(gridStart, i));
}
