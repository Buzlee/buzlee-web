// PORTED FROM buzlee-app/src/entities/flyer/lib/lineup.ts — keep in sync; see docs/admin-sync.md
/**
 * Pure helpers for the multi-event lineup v2 (Paper page "Flyer Lineup v2
 * (Exploration)"): density switch, Now strip, horizon chapters, date-rail day
 * index and detail-sheet date chips. All wall-clock rules match
 * flyer-helper.ts / flyer-occurrences.ts — naive local timestamps throughout.
 */
import {
  addDaysLocal,
  endOfLocalDay,
  formatDateLocal,
  isSameLocalDay,
  parseDateLocal,
  startOfLocalDay,
} from "@/shared/lib/date-local";
import {
  type FlyerEventSchedule,
  getEventOccurrenceWindow,
  getEventSpanEnd,
  type OccurrenceWindow,
  parseEventTimestamp,
} from "./flyer-helper";
import {
  countEventOccurrences,
  expandOccurrenceStartDays,
} from "./flyer-occurrences";
import { parseRecurrenceFrequency } from "./flyer-recurrence";

/** 5+ events switch the lineup from horizon chapters to the date rail. */
const RAIL_MIN_EVENTS = 5;
/** "Starting soon" horizon for the Now strip. */
const IMMINENT_MS = 2 * 60 * 60 * 1000;
/** Date-rail window for unbounded (or very long) series. */
export const RAIL_WINDOW_DAYS = 56;

export type LineupVariant = "chapters" | "rail";

export function getLineupVariant(events: readonly unknown[]): LineupVariant {
  return events.length >= RAIL_MIN_EVENTS ? "rail" : "chapters";
}

export type EventTimeStatus = "live" | "today" | "upcoming" | "ended";

/**
 * Time state of an event's current-or-next occurrence, driving the detail
 * sheet's primary-action ladder and row emphasis. A bounded series past its
 * last occurrence reads 'ended' (getEventOccurrenceWindow returns the LAST
 * occurrence in that case, whose end is in the past).
 */
export function getEventTimeStatus(
  event: FlyerEventSchedule,
  now: Date = new Date(),
): EventTimeStatus {
  const window = getEventOccurrenceWindow(event, now);
  if (window.end < now) return "ended";
  if (window.start <= now) return "live";
  return isSameLocalDay(window.start, now) ? "today" : "upcoming";
}

export type NowStripHit<T extends FlyerEventSchedule> = {
  event: T;
  window: OccurrenceWindow;
  /** true = in progress; false = starts within the imminent horizon. */
  live: boolean;
};

/**
 * The occurrence the Now strip pins: live now, else starting within 2 hours.
 * Earliest start wins so overlapping events surface deterministically.
 */
export function findLiveOrImminentOccurrence<T extends FlyerEventSchedule>(
  events: T[],
  now: Date = new Date(),
): NowStripHit<T> | null {
  let best: NowStripHit<T> | null = null;
  for (const event of events) {
    const window = getEventOccurrenceWindow(event, now);
    if (window.end < now) continue;
    const live = window.start <= now;
    if (!live && window.start.getTime() - now.getTime() > IMMINENT_MS) continue;
    if (!best || window.start < best.window.start)
      best = { event, window, live };
  }
  return best;
}

export type LineupHorizonGroup<T extends FlyerEventSchedule> = {
  key: string;
  label: string;
  events: T[];
};

function monthLabel(start: Date, now: Date): string {
  const month = start.toLocaleDateString("en-US", { month: "long" });
  const sameMonth =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth();
  if (sameMonth) return `Later in ${month}`;
  return start.getFullYear() === now.getFullYear()
    ? `In ${month}`
    : `In ${month} ${start.getFullYear()}`;
}

/**
 * Chapters buckets: Today · This week (next 7 days) · one group per later
 * month · Ended last. Events are ordered by their current-or-next occurrence
 * start inside every group.
 */
export function groupEventsByHorizon<T extends FlyerEventSchedule>(
  events: T[],
  now: Date = new Date(),
): LineupHorizonGroup<T>[] {
  const entries = events
    .map((event) => ({ event, window: getEventOccurrenceWindow(event, now) }))
    .sort((a, b) => a.window.start.getTime() - b.window.start.getTime());

  const todayEnd = endOfLocalDay(now);
  const weekEnd = endOfLocalDay(addDaysLocal(now, 6));

  const today: T[] = [];
  const week: T[] = [];
  const past: T[] = [];
  const months = new Map<string, { label: string; events: T[] }>();

  for (const { event, window } of entries) {
    if (window.end < now) {
      past.push(event);
    } else if (window.start <= todayEnd) {
      today.push(event);
    } else if (window.start <= weekEnd) {
      week.push(event);
    } else {
      const key = `month-${window.start.getFullYear()}-${String(window.start.getMonth() + 1).padStart(2, "0")}`;
      const group = months.get(key) ?? {
        label: monthLabel(window.start, now),
        events: [],
      };
      group.events.push(event);
      months.set(key, group);
    }
  }

  const groups: LineupHorizonGroup<T>[] = [];
  if (today.length > 0)
    groups.push({ key: "today", label: "Today", events: today });
  if (week.length > 0)
    groups.push({ key: "week", label: "This week", events: week });
  for (const [key, group] of [...months.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    groups.push({ key, label: group.label, events: group.events });
  }
  if (past.length > 0)
    groups.push({ key: "past", label: "Ended", events: past });
  return groups;
}

/**
 * Occurrence-start days per local calendar day for the date rail: chip
 * density dots and the selected-day card list. Each day's events are ordered
 * by their wall-clock start time.
 */
export function buildDayIndex<T extends FlyerEventSchedule>(
  events: T[],
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const event of events) {
    for (const day of expandOccurrenceStartDays(event, rangeStart, rangeEnd)) {
      const list = index.get(day) ?? [];
      list.push(event);
      index.set(day, list);
    }
  }
  const timeOfDay = (event: T) => {
    const start = parseEventTimestamp(event.starts_at);
    return start.getHours() * 60 + start.getMinutes();
  };
  for (const list of index.values()) {
    list.sort((a, b) => timeOfDay(a) - timeOfDay(b));
  }
  return index;
}

/**
 * Rail range: today through the latest bounded span end, capped at
 * {@link RAIL_WINDOW_DAYS}; unbounded series fill the whole window. When every
 * event has ended the range covers the past span instead, so the rail still
 * renders something meaningful.
 */
export function getLineupRailRange(
  events: FlyerEventSchedule[],
  now: Date = new Date(),
): {
  start: Date;
  end: Date;
} {
  const start = startOfLocalDay(now);
  const cap = endOfLocalDay(addDaysLocal(start, RAIL_WINDOW_DAYS - 1));

  let latestEnd: Date | null = null;
  let earliestStart: Date | null = null;
  let unbounded = false;
  for (const event of events) {
    const eventStart = parseEventTimestamp(event.starts_at);
    if (!earliestStart || eventStart < earliestStart)
      earliestStart = eventStart;
    const spanEnd = getEventSpanEnd(event);
    if (spanEnd === null) unbounded = true;
    else if (!latestEnd || spanEnd > latestEnd) latestEnd = spanEnd;
  }

  if (!unbounded && latestEnd && latestEnd < start && earliestStart) {
    return {
      start: startOfLocalDay(earliestStart),
      end: endOfLocalDay(latestEnd),
    };
  }
  if (unbounded || !latestEnd || latestEnd > cap) return { start, end: cap };
  return { start, end: endOfLocalDay(latestEnd) };
}

/** Day the rail auto-selects: today when it has occurrences, else the next day that does, else the last. */
export function defaultSelectedDay(
  dayIndex: Map<string, unknown>,
  now: Date = new Date(),
): string | null {
  if (dayIndex.size === 0) return null;
  const todayKey = formatDateLocal(now);
  const days = [...dayIndex.keys()].sort();
  if (dayIndex.has(todayKey)) return todayKey;
  return days.find((day) => day > todayKey) ?? days[days.length - 1];
}

/**
 * Upcoming occurrence-start days (`YYYY-MM-DD`) of ONE event for the detail
 * sheet's date chips — first element is the NEXT occurrence. Capped for
 * display; unbounded series just fill the cap.
 */
export function remainingOccurrenceDates(
  event: FlyerEventSchedule,
  now: Date = new Date(),
  cap: number = 12,
): string[] {
  const start = startOfLocalDay(now);
  const spanEnd = getEventSpanEnd(event);
  const end =
    spanEnd && spanEnd >= start
      ? spanEnd
      : endOfLocalDay(addDaysLocal(start, 365));
  return expandOccurrenceStartDays(event, start, end, cap + 1).slice(0, cap);
}

/**
 * Position of an occurrence day inside a bounded series ("WEEK 3 OF 6").
 * Null for one-time events, unbounded series, or a day outside the series.
 */
export function getOccurrenceOrdinal(
  event: FlyerEventSchedule,
  day: string,
): { index: number; total: number; unit: "day" | "week" | "month" } | null {
  const freq = parseRecurrenceFrequency(event.recurrence_rule);
  if (!freq || !event.recurrence_until) return null;
  const total = countEventOccurrences(event);
  if (!total || total <= 1) return null;
  const seriesStart = parseEventTimestamp(event.starts_at);
  const untilEnd = endOfLocalDay(parseDateLocal(event.recurrence_until));
  const index = expandOccurrenceStartDays(event, seriesStart, untilEnd).indexOf(
    day,
  );
  if (index === -1) return null;
  const unit = freq === "daily" ? "day" : freq === "weekly" ? "week" : "month";
  return { index: index + 1, total, unit };
}
