// PORTED FROM buzlee-app/src/entities/flyer/lib/flyer-occurrences.ts — keep in sync; see docs/admin-sync.md
/**
 * Occurrence expansion for calendars and counts ("4 Fridays").
 * Pure, string-in / string-out on local calendar dates.
 */
import {
  addDaysLocal,
  addMonthsLocal,
  endOfLocalDay,
  formatDateLocal,
  parseDateLocal,
  startOfLocalDay,
} from "@/shared/lib/date-local";
import { type FlyerEventSchedule, parseEventTimestamp } from "./flyer-helper";
import {
  parseRecurrenceFrequency,
  parseWeeklyByDays,
} from "./flyer-recurrence";

const DEFAULT_CAP = 366;

/**
 * Every local calendar day (`YYYY-MM-DD`) on which an occurrence of the event
 * STARTS, within [rangeStart, rangeEnd] inclusive. Multi-day occurrences only
 * mark their start day (the calendar shows a dot where something begins).
 * Unbounded series are capped at `cap` occurrences past the range start.
 */
export function expandOccurrenceStartDays(
  event: FlyerEventSchedule,
  rangeStart: Date,
  rangeEnd: Date,
  cap: number = DEFAULT_CAP,
): string[] {
  const start = parseEventTimestamp(event.starts_at);
  const freq = parseRecurrenceFrequency(event.recurrence_rule);
  const lo = startOfLocalDay(rangeStart);
  const hi = endOfLocalDay(rangeEnd);

  if (!freq) {
    return start >= lo && start <= hi ? [formatDateLocal(start)] : [];
  }

  const untilEnd = event.recurrence_until
    ? endOfLocalDay(parseDateLocal(event.recurrence_until))
    : null;
  const limit = untilEnd && untilEnd < hi ? untilEnd : hi;
  const days: string[] = [];

  if (freq === "daily") {
    let cursor = new Date(start);
    let n = 0;
    while (cursor <= limit && n < cap) {
      if (cursor >= lo) days.push(formatDateLocal(cursor));
      cursor = addDaysLocal(cursor, 1);
      n += 1;
    }
    return days;
  }

  if (freq === "weekly") {
    const byDays = parseWeeklyByDays(event.recurrence_rule);
    const weekdays = byDays.length > 0 ? byDays : [start.getDay()];
    let cursor = new Date(start);
    let n = 0;
    while (cursor <= limit && n < cap * 7) {
      if (weekdays.includes(cursor.getDay()) && cursor >= start) {
        if (cursor >= lo) days.push(formatDateLocal(cursor));
      }
      cursor = addDaysLocal(cursor, 1);
      n += 1;
    }
    return days;
  }

  // monthly
  let k = 0;
  let cursor = addMonthsLocal(start, 0);
  while (cursor <= limit && k < cap) {
    if (cursor >= lo) days.push(formatDateLocal(cursor));
    k += 1;
    cursor = addMonthsLocal(start, k);
  }
  return days;
}

/**
 * Number of occurrences in a bounded series ("Repeats until … · 4 Fridays").
 * Returns null for unbounded series (no `recurrence_until`) and 1 for
 * non-recurring events.
 */
export function countEventOccurrences(
  event: FlyerEventSchedule,
  cap: number = DEFAULT_CAP,
): number | null {
  if (!parseRecurrenceFrequency(event.recurrence_rule)) return 1;
  if (!event.recurrence_until) return null;
  const start = parseEventTimestamp(event.starts_at);
  const until = endOfLocalDay(parseDateLocal(event.recurrence_until));
  return expandOccurrenceStartDays(event, start, until, cap).length;
}
