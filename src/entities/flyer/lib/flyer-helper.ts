// PORTED FROM buzlee-app/src/entities/flyer/lib/flyer-helper.ts — keep in sync; see docs/admin-sync.md

import {
  addDaysLocal,
  addMonthsLocal,
  endOfLocalDay,
  parseDateLocal,
  startOfLocalDay,
} from "@/shared/lib/date-local";
import type { Flyer, FlyerEvent, FlyerWithDetails } from "../model/types";
import {
  parseRecurrenceFrequency,
  parseWeeklyByDayCodes,
  parseWeeklyByDays,
  WEEKDAY_LABEL_BY_CODE,
} from "./flyer-recurrence";

export type OccurrenceWindow = { start: Date; end: Date };

/** The schedule fields of one flyer_events row. */
export type FlyerEventSchedule = Pick<
  FlyerEvent,
  "starts_at" | "ends_at" | "recurrence_rule" | "recurrence_until"
>;

/**
 * What the occurrence helpers need from a flyer. `events` is optional so
 * every existing caller keeps compiling: when present (FlyerWithDetails) the
 * helpers look at each event; when absent they fall back to the summary
 * columns (event_date / event_end_date / recurrence_rule).
 */
export type FlyerSchedule = Pick<Flyer, "event_date" | "event_end_date"> & {
  recurrence_rule?: string | null;
  events?: FlyerEventSchedule[] | null;
};

/**
 * Parse a database timestamp as local time.
 * Supabase returns timestamptz values with a UTC offset (e.g. +00:00),
 * but the app stores user-entered local date/time values as naive UTC.
 * Stripping the offset lets `new Date()` interpret the value in
 * the device's local timezone, keeping display consistent with input.
 */
export function parseEventTimestamp(timestamp: string): Date {
  const naive = timestamp.replace(/[+-]\d{2}(:\d{2})?$/, "").replace(/Z$/, "");
  return new Date(naive);
}

export function isFlyerRecurring(flyer: FlyerSchedule): boolean {
  return parseRecurrenceFrequency(flyer.recurrence_rule) !== null;
}

const addMonthsClamped = addMonthsLocal;

/**
 * Check if flyer is currently live
 */
export function isFlyerLive(flyer: Flyer): boolean {
  if (flyer.status !== "live") return false;

  const now = new Date();
  const liveAt = flyer.live_at ? new Date(flyer.live_at) : null;
  const expiresAt = flyer.expires_at ? new Date(flyer.expires_at) : null;

  if (!liveAt) return false;
  if (liveAt > now) return false;
  if (expiresAt && expiresAt < now) return false;

  return true;
}

const endOfLocalCalendarDay = endOfLocalDay;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole local calendar days from `a` to `b` (DST-safe: compares local midnights). */
function localDaysBetween(a: Date, b: Date): number {
  return Math.round(
    (startOfLocalDay(b).getTime() - startOfLocalDay(a).getTime()) / DAY_MS,
  );
}

/**
 * Latest start of a fixed-step series (daily = 1, weekly without BYDAY = 7)
 * on or before `limit`, stepping by local calendar days so the wall-clock
 * time survives DST transitions. Returns `firstStart` when `limit` precedes it.
 */
function latestFixedStepStartOnOrBefore(
  firstStart: Date,
  stepDays: number,
  limit: Date,
): Date {
  if (limit <= firstStart) return firstStart;
  let steps = Math.floor(localDaysBetween(firstStart, limit) / stepDays);
  let candidate = addDaysLocal(firstStart, steps * stepDays);
  while (candidate > limit && steps > 0) {
    steps -= 1;
    candidate = addDaysLocal(firstStart, steps * stepDays);
  }
  return candidate;
}

/** Earliest BYDAY occurrence on/after `baseStart` (not the first code in list order). */
function firstWeeklyOccurrenceStart(baseStart: Date, weekdays: number[]): Date {
  let earliest: Date | null = null;
  for (const day of weekdays) {
    const dayDelta = (day - baseStart.getDay() + 7) % 7;
    const candidate = addDaysLocal(baseStart, dayDelta);
    if (candidate >= baseStart && (!earliest || candidate < earliest))
      earliest = candidate;
  }
  return earliest ?? addDaysLocal(baseStart, 7);
}

function getWeeklyOccurrenceCandidates(
  baseStart: Date,
  weekdays: number[],
  reference: Date,
): { previous: Date | null; next: Date | null } {
  if (weekdays.length === 0) return { previous: null, next: null };

  const pivot = reference > baseStart ? reference : baseStart;
  const rangeStart = new Date(pivot);
  rangeStart.setDate(rangeStart.getDate() - 7);
  rangeStart.setHours(0, 0, 0, 0);

  const rangeEnd = new Date(pivot);
  rangeEnd.setDate(rangeEnd.getDate() + 14);
  rangeEnd.setHours(23, 59, 59, 999);

  let previous: Date | null = null;
  let next: Date | null = null;
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    if (weekdays.includes(cursor.getDay())) {
      const candidate = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate(),
        baseStart.getHours(),
        baseStart.getMinutes(),
        baseStart.getSeconds(),
        baseStart.getMilliseconds(),
      );

      if (candidate >= baseStart && candidate <= reference) {
        if (!previous || candidate > previous) previous = candidate;
      }
      if (candidate >= baseStart && candidate >= reference) {
        if (!next || candidate < next) next = candidate;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return { previous, next };
}

function buildOccurrenceWindowFromDuration(
  start: Date,
  durationMs: number | null,
): { start: Date; end: Date } {
  if (durationMs === null) {
    return { start, end: endOfLocalCalendarDay(start) };
  }
  return { start, end: new Date(start.getTime() + durationMs) };
}

/**
 * Parse event_end_date as the instant the event window closes.
 * A midnight time part is the "date-only" sentinel (see {@link hasFlyerEndTime}):
 * the event runs through the end of that local calendar day, mirroring the
 * end-of-day treatment flyers with no end date get.
 */
function parseEventEndInstant(eventEndDate: string): Date {
  const end = parseEventTimestamp(eventEndDate);
  return hasFlyerEndTime(eventEndDate) ? end : endOfLocalCalendarDay(end);
}

/**
 * Last occurrence start on or before `limit` for a series that starts at
 * `firstStart` (used when the current-or-next candidate lands after the
 * series' `recurrence_until`).
 */
function lastOccurrenceStartBefore(
  firstStart: Date,
  freq: "daily" | "weekly" | "monthly",
  weeklyByDays: number[],
  limit: Date,
): Date {
  if (limit <= firstStart) return firstStart;

  if (freq === "weekly" && weeklyByDays.length > 0) {
    return (
      getWeeklyOccurrenceCandidates(firstStart, weeklyByDays, limit).previous ??
      firstStart
    );
  }

  if (freq === "daily" || freq === "weekly") {
    return latestFixedStepStartOnOrBefore(
      firstStart,
      freq === "daily" ? 1 : 7,
      limit,
    );
  }

  // monthly: walk back from the month of `limit` until we are on/before it
  let delta =
    (limit.getFullYear() - firstStart.getFullYear()) * 12 +
    (limit.getMonth() - firstStart.getMonth());
  let candidate = addMonthsClamped(firstStart, Math.max(0, delta));
  while (candidate > limit && delta > 0) {
    delta -= 1;
    candidate = addMonthsClamped(firstStart, delta);
  }
  return candidate;
}

/**
 * Core occurrence math shared by the flyer-level and event-level helpers.
 *
 * Non-recurring: the base window. Recurring: the occurrence in progress at
 * `reference`, else the next one. When the series has an end
 * (`until`, a YYYY-MM-DD local date) and the candidate would start after
 * that day, the LAST occurrence is returned instead — its `end` is then in
 * the past, so "upcoming" predicates naturally turn false and sort/bucket
 * logic treats the series like any finished event.
 */
function computeOccurrenceWindow(
  baseStart: Date,
  baseEnd: Date | null,
  rule: string | null | undefined,
  until: string | null | undefined,
  reference: Date,
): OccurrenceWindow {
  const freq = parseRecurrenceFrequency(rule);
  const baseDurationMs = baseEnd
    ? Math.max(0, baseEnd.getTime() - baseStart.getTime())
    : null;

  if (!freq) {
    return buildOccurrenceWindowFromDuration(baseStart, baseDurationMs);
  }

  const weeklyByDays = freq === "weekly" ? parseWeeklyByDays(rule) : [];
  const firstStart =
    freq === "weekly" && weeklyByDays.length > 0
      ? firstWeeklyOccurrenceStart(baseStart, weeklyByDays)
      : baseStart;

  let occurrence: OccurrenceWindow;

  if (freq === "daily" || freq === "weekly") {
    const stepDays = freq === "daily" ? 1 : 7;

    let resolved: OccurrenceWindow | null = null;
    if (freq === "weekly" && weeklyByDays.length > 0) {
      const { previous, next } = getWeeklyOccurrenceCandidates(
        firstStart,
        weeklyByDays,
        reference,
      );
      if (previous) {
        const previousOccurrence = buildOccurrenceWindowFromDuration(
          previous,
          baseDurationMs,
        );
        if (previousOccurrence.end >= reference) resolved = previousOccurrence;
      }
      if (!resolved && next)
        resolved = buildOccurrenceWindowFromDuration(next, baseDurationMs);
    }

    if (resolved) {
      occurrence = resolved;
    } else {
      let occurrenceStart = latestFixedStepStartOnOrBefore(
        firstStart,
        stepDays,
        reference,
      );
      occurrence = buildOccurrenceWindowFromDuration(
        occurrenceStart,
        baseDurationMs,
      );
      if (occurrence.end < reference) {
        occurrenceStart = addDaysLocal(occurrenceStart, stepDays);
        occurrence = buildOccurrenceWindowFromDuration(
          occurrenceStart,
          baseDurationMs,
        );
      }
    }
  } else {
    let monthDelta =
      (reference.getFullYear() - baseStart.getFullYear()) * 12 +
      (reference.getMonth() - baseStart.getMonth());
    if (monthDelta < 0) monthDelta = 0;
    let occurrenceStart = addMonthsClamped(baseStart, monthDelta);
    occurrence = buildOccurrenceWindowFromDuration(
      occurrenceStart,
      baseDurationMs,
    );
    while (occurrence.end < reference) {
      occurrenceStart = addMonthsClamped(occurrenceStart, 1);
      occurrence = buildOccurrenceWindowFromDuration(
        occurrenceStart,
        baseDurationMs,
      );
    }
  }

  if (until) {
    const untilEnd = endOfLocalCalendarDay(parseDateLocal(until));
    if (occurrence.start > untilEnd) {
      const lastStart = lastOccurrenceStartBefore(
        firstStart,
        freq,
        weeklyByDays,
        untilEnd,
      );
      occurrence = buildOccurrenceWindowFromDuration(lastStart, baseDurationMs);
    }
  }

  return occurrence;
}

/**
 * Current-or-next occurrence window of ONE event (flyer_events row).
 */
export function getEventOccurrenceWindow(
  event: FlyerEventSchedule,
  reference: Date = new Date(),
): OccurrenceWindow {
  const baseStart = parseEventTimestamp(event.starts_at);
  const baseEnd = event.ends_at ? parseEventEndInstant(event.ends_at) : null;
  return computeOccurrenceWindow(
    baseStart,
    baseEnd,
    event.recurrence_rule,
    event.recurrence_until,
    reference,
  );
}

/**
 * The window that best represents a flyer at `reference`: the earliest-starting
 * event window that has not ended yet, else the latest-ending past window (so
 * finished multi-event flyers sort and bucket like finished single ones).
 * Falls back to the summary columns when the flyer was fetched without events.
 */
export function getFlyerNextOccurrenceWindow(
  flyer: FlyerSchedule,
  reference: Date = new Date(),
): OccurrenceWindow & { event: FlyerEventSchedule | null } {
  const events = flyer.events ?? [];

  if (events.length === 0) {
    const baseStart = parseEventTimestamp(flyer.event_date);
    const baseEnd = flyer.event_end_date
      ? parseEventEndInstant(flyer.event_end_date)
      : null;
    const window = computeOccurrenceWindow(
      baseStart,
      baseEnd,
      flyer.recurrence_rule,
      null,
      reference,
    );
    return { ...window, event: null };
  }

  let upcoming: { window: OccurrenceWindow; event: FlyerEventSchedule } | null =
    null;
  let latestPast: {
    window: OccurrenceWindow;
    event: FlyerEventSchedule;
  } | null = null;

  for (const event of events) {
    const window = getEventOccurrenceWindow(event, reference);
    if (window.end >= reference) {
      if (!upcoming || window.start < upcoming.window.start)
        upcoming = { window, event };
    } else if (!latestPast || window.end > latestPast.window.end) {
      latestPast = { window, event };
    }
  }

  // Web fix: `events` is non-empty here, so one of the two is always set; make
  // that explicit instead of a non-null assertion.
  const pick = upcoming ?? latestPast;
  if (!pick) throw new Error("flyer has events but no occurrence window");
  return { start: pick.window.start, end: pick.window.end, event: pick.event };
}

/**
 * Adapter kept for the many existing callers: same signature as before, now
 * event-aware when `flyer.events` is present.
 */
export function getFlyerCurrentOrNextOccurrenceWindow(
  flyer: FlyerSchedule,
  reference: Date = new Date(),
): OccurrenceWindow {
  const { start, end } = getFlyerNextOccurrenceWindow(flyer, reference);
  return { start, end };
}

export function formatLocalNaiveTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Whether a flyer should appear in resident discovery (map / feed).
 * With {@link Flyer.event_end_date} set, the window ends at that instant.
 * With no end date, the window is the full local calendar day of {@link Flyer.event_date}
 * so all-day / single-day events are not hidden at midnight on the event day.
 * Past events only surface in Saved → Past.
 */
export function isFlyerEventUpcomingForDiscovery(
  flyer: FlyerSchedule,
): boolean {
  const now = new Date();
  const { end } = getFlyerCurrentOrNextOccurrenceWindow(flyer, now);
  return end >= now;
}

/**
 * Business “discovery preview”: RLS returns live ∪ own non-live; this matches rows the UI should show.
 * Security remains in RLS — this only aligns the client list with product rules.
 */
export function passesBusinessDiscoveryVisibility(
  flyer: FlyerWithDetails,
  businessId: string,
): boolean {
  if (flyer.business_id === businessId && !isFlyerLive(flyer)) return true;
  return isFlyerLive(flyer) && isFlyerEventUpcomingForDiscovery(flyer);
}

/**
 * Whether the flyer’s event window includes the device’s current local calendar day
 * (handles multi-day events via {@link Flyer.event_end_date}).
 */
export function isFlyerEventOnLocalCalendarToday(
  flyer: FlyerSchedule,
): boolean {
  const events = flyer.events ?? [];
  if (events.length > 0) {
    return events.some((event) => isEventOnLocalCalendarToday(event));
  }
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalCalendarDay(now);
  const occurrence = getFlyerCurrentOrNextOccurrenceWindow(flyer, todayStart);
  return occurrence.start <= todayEnd && occurrence.end >= todayStart;
}

/**
 * Whether one event has an occurrence overlapping the device's current local
 * calendar day (drives the per-event Check In button).
 */
export function isEventOnLocalCalendarToday(
  event: FlyerEventSchedule,
  now: Date = new Date(),
): boolean {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalCalendarDay(now);
  const occurrence = getEventOccurrenceWindow(event, todayStart);
  return occurrence.start <= todayEnd && occurrence.end >= todayStart;
}

/**
 * Saved → Upcoming tab: event has not started yet ({@link Flyer.event_date} strictly after now).
 */
export function isFlyerEventStartInFuture(flyer: FlyerSchedule): boolean {
  return getFlyerCurrentOrNextOccurrenceWindow(flyer).start > new Date();
}

export function getFlyerSortTimestamp(flyer: FlyerSchedule): number {
  return getFlyerCurrentOrNextOccurrenceWindow(flyer).start.getTime();
}

/**
 * Map carousel: members-only flyers from businesses the resident belongs to appear first.
 * Preserves relative order within each group.
 */
export function sortFlyersMembersOnlyFirstForMember(
  flyers: FlyerWithDetails[],
  memberBusinessIds: ReadonlySet<string>,
): FlyerWithDetails[] {
  if (memberBusinessIds.size === 0) return flyers;

  const membersOnly: FlyerWithDetails[] = [];
  const rest: FlyerWithDetails[] = [];

  for (const flyer of flyers) {
    if (
      flyer.visibility === "members_only" &&
      memberBusinessIds.has(flyer.business_id)
    ) {
      membersOnly.push(flyer);
    } else {
      rest.push(flyer);
    }
  }

  if (membersOnly.length === 0) return flyers;
  return [...membersOnly, ...rest];
}

/**
 * "Every Friday", "Every Monday and Wednesday", … with an optional
 * " through Aug 28" suffix when the series has a `recurrence_until`.
 */
export function formatFlyerRecurrenceLine(
  flyer: Pick<Flyer, "recurrence_rule"> & { recurrence_until?: string | null },
): string | null {
  const freq = parseRecurrenceFrequency(flyer.recurrence_rule);
  if (!freq) return null;

  let line: string;
  if (freq === "daily") line = "Every day";
  else if (freq === "monthly") line = "Every month";
  else {
    const labels = parseWeeklyByDayCodes(flyer.recurrence_rule).map(
      (code) => WEEKDAY_LABEL_BY_CODE[code],
    );
    if (labels.length === 0) line = "Every week";
    else if (labels.length === 1) line = `Every ${labels[0]}`;
    else if (labels.length === 2) line = `Every ${labels[0]} and ${labels[1]}`;
    else
      line = `Every ${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  }

  if (flyer.recurrence_until) {
    line += ` through ${formatShortMonthDay(parseDateLocal(flyer.recurrence_until))}`;
  }
  return line;
}

function formatShortMonthDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * "5–7 PM", "9 AM–4 PM", "6:30 PM" — the shared meridiem is dropped from the
 * first time when both sides match. `end` null → start only.
 */
export function formatCompactTimeRange(start: Date, end: Date | null): string {
  const part = (d: Date, withMeridiem: boolean) => {
    const hours24 = d.getHours();
    const minutes = d.getMinutes();
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const meridiem = hours24 < 12 ? "AM" : "PM";
    const base =
      minutes === 0
        ? `${hours12}`
        : `${hours12}:${String(minutes).padStart(2, "0")}`;
    return withMeridiem ? `${base} ${meridiem}` : base;
  };
  if (!end) return part(start, true);
  const sameMeridiem = start.getHours() < 12 === end.getHours() < 12;
  return `${part(start, !sameMeridiem)}–${part(end, true)}`;
}

/** Wall-clock end of the LAST occurrence of an event; null when the series is unbounded. */
export function getEventSpanEnd(event: FlyerEventSchedule): Date | null {
  const start = parseEventTimestamp(event.starts_at);
  const end = event.ends_at
    ? parseEventEndInstant(event.ends_at)
    : endOfLocalCalendarDay(start);
  if (!parseRecurrenceFrequency(event.recurrence_rule)) return end;
  if (!event.recurrence_until) return null;
  const untilDay = parseDateLocal(event.recurrence_until);
  const offsetMs = end.getTime() - startOfLocalDay(start).getTime();
  return new Date(untilDay.getTime() + offsetMs);
}

function pluralWeekdayLabels(rule: string | null | undefined): string {
  const labels = parseWeeklyByDayCodes(rule).map(
    (code) => `${WEEKDAY_LABEL_BY_CODE[code]}s`,
  );
  if (labels.length === 0) return "Weekly";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} & ${labels[labels.length - 1]}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/**
 * One-line schedule for an event row:
 *   "Fridays · 5–7 PM · through Aug 28"   (recurring)
 *   "Aug 4–8 · 9 AM–4 PM"                 (multi-day)
 *   "Sat, Aug 15 · 10 AM–12 PM"           (single day)
 * The time segment is omitted for all-day events (start at T00:00).
 */
export function formatFlyerEventLine(event: FlyerEventSchedule): string {
  const start = parseEventTimestamp(event.starts_at);
  const hasStartTime = start.getHours() !== 0 || start.getMinutes() !== 0;
  const end =
    event.ends_at && hasFlyerEndTime(event.ends_at)
      ? parseEventTimestamp(event.ends_at)
      : null;
  const timePart = hasStartTime ? formatCompactTimeRange(start, end) : null;
  const freq = parseRecurrenceFrequency(event.recurrence_rule);

  const parts: string[] = [];

  if (freq) {
    if (freq === "daily") parts.push("Daily");
    else if (freq === "monthly")
      parts.push(`Monthly on the ${ordinal(start.getDate())}`);
    else parts.push(pluralWeekdayLabels(event.recurrence_rule));
    if (timePart) parts.push(timePart);
    if (event.recurrence_until) {
      parts.push(
        `through ${formatShortMonthDay(parseDateLocal(event.recurrence_until))}`,
      );
    }
    return parts.join(" · ");
  }

  const endDay = event.ends_at ? parseEventTimestamp(event.ends_at) : null;
  const multiDay =
    endDay !== null &&
    !(
      endDay.getFullYear() === start.getFullYear() &&
      endDay.getMonth() === start.getMonth() &&
      endDay.getDate() === start.getDate()
    );

  if (multiDay && endDay) {
    parts.push(formatDayRange(start, endDay));
  } else {
    parts.push(
      start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    );
  }
  if (timePart) parts.push(timePart);
  return parts.join(" · ");
}

/** "Aug 4–8", "Aug 28 – Sep 3", "Aug 4" (same day). */
function formatDayRange(start: Date, end: Date): string {
  const startPart = formatShortMonthDay(start);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) return startPart;
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  if (sameMonth) return `${startPart}–${end.getDate()}`;
  return `${startPart} – ${formatShortMonthDay(end)}`;
}

/**
 * Card / preview line for a multi-event flyer: "3 events · Aug 4–28".
 * The range runs from the earliest start to the latest span end (a recurring
 * event contributes its `recurrence_until`); an unbounded series yields
 * "3 events · from Aug 4".
 */
export function formatFlyerEventsSummaryLine(
  events: FlyerEventSchedule[],
): string {
  const count = events.length;
  const label = `${count} ${count === 1 ? "event" : "events"}`;
  if (count === 0) return label;

  let earliest: Date | null = null;
  let latest: Date | null = null;
  let unbounded = false;
  for (const event of events) {
    const start = parseEventTimestamp(event.starts_at);
    if (!earliest || start < earliest) earliest = start;
    const spanEnd = getEventSpanEnd(event);
    if (spanEnd === null) unbounded = true;
    else if (!latest || spanEnd > latest) latest = spanEnd;
  }

  if (!earliest) return label;
  if (unbounded || !latest)
    return `${label} · from ${formatShortMonthDay(earliest)}`;
  return `${label} · ${formatDayRange(earliest, latest)}`;
}

/**
 * Check if flyer is buzzing (high engagement)
 */
export function isFlyerBuzzing(flyer: Flyer): boolean {
  if (flyer.is_buzzing) return true;

  const threshold = flyer.buzzing_threshold ?? 50;
  const totalEngagement =
    (flyer.view_count ?? 0) +
    (flyer.save_count ?? 0) * 2 +
    (flyer.share_count ?? 0) * 3;

  return totalEngagement >= threshold;
}

/**
 * Calculate days until event
 */
export function daysUntilEvent(eventDate: string): number {
  const now = new Date();
  const event = parseEventTimestamp(eventDate);
  const diffTime = event.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format event date range for display
 */
export function formatEventDateRange(
  eventDate: string,
  eventEndDate?: string | null,
): string {
  const start = parseEventTimestamp(eventDate);
  const end = eventEndDate ? parseEventTimestamp(eventEndDate) : null;

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };

  if (!end) {
    return start.toLocaleDateString("en-US", options);
  }

  if (start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }

  return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
}

const SHEET_DATE_START: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "short",
  day: "numeric",
};

/**
 * Date line for flyer sheet: single day, or multi-day with en dash; same month shows end day only,
 * different months show short month + day for the end.
 */
export function formatFlyerSheetDateLine(
  eventDate: string,
  eventEndDate?: string | null,
): string {
  const start = parseEventTimestamp(eventDate);
  if (!eventEndDate) {
    return start.toLocaleDateString("en-US", SHEET_DATE_START);
  }
  const end = parseEventTimestamp(eventEndDate);
  const sameCalendarDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameCalendarDay) {
    return start.toLocaleDateString("en-US", SHEET_DATE_START);
  }

  const startPart = start.toLocaleDateString("en-US", SHEET_DATE_START);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${startPart} – ${end.getDate()}`;
  }
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  return `${startPart} – ${endMonth} ${end.getDate()}`;
}

const CARD_DATE_START: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
};

/**
 * Flyer cards: start date only (no time). If `event_end_date` is set and spans another day,
 * appends en dash + compact end (same month: day only; else short month + day).
 */
export function formatFlyerCardDateLine(
  eventDate: string,
  eventEndDate?: string | null,
): string {
  const start = parseEventTimestamp(eventDate);
  if (!eventEndDate) {
    return start.toLocaleDateString("en-US", CARD_DATE_START);
  }
  const end = parseEventTimestamp(eventEndDate);
  const sameCalendarDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameCalendarDay) {
    return start.toLocaleDateString("en-US", CARD_DATE_START);
  }

  const startPart = start.toLocaleDateString("en-US", CARD_DATE_START);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${startPart} – ${end.getDate()}`;
  }
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  return `${startPart} – ${endMonth} ${end.getDate()}`;
}

/**
 * Get the display image URL for a flyer.
 * Prefers cover_photo_url over media_url.
 */
export function getFlyerImageUrl(
  flyer: Pick<Flyer, "cover_photo_url" | "media_url">,
): string | null {
  return flyer.cover_photo_url || flyer.media_url || null;
}

/**
 * Format event date with weekday for card display
 */
export function formatEventDate(eventDate: string): string {
  const date = parseEventTimestamp(eventDate);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * True when the flyer has an explicit end time (not end-date-only at midnight).
 * `T00:00` is reserved as the "date-only" sentinel, so a literal midnight end
 * time cannot be expressed; form validation rejects end instants that don't
 * land strictly after the start, which keeps the sentinel unambiguous.
 */
export function hasFlyerEndTime(eventEndDate?: string | null): boolean {
  if (!eventEndDate) return false;
  const timePart = eventEndDate.split("T")[1]?.substring(0, 5) ?? "00:00";
  return timePart !== "00:00";
}

/**
 * Format time display with optional end time
 */
export function formatTimeRange(
  eventDate: string,
  eventEndDate?: string | null,
): string {
  const start = parseEventTimestamp(eventDate);
  const formattedTime = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!eventEndDate) return formattedTime;

  const end = parseEventTimestamp(eventEndDate);
  const formattedEndTime = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formattedTime} – ${formattedEndTime}`;
}

/**
 * Second line for flyer cards: start–end time, or null for all-day events (matches FlyerSheet).
 */
export function formatFlyerCardTimeLine(
  eventDate: string,
  eventEndDate?: string | null,
): string | null {
  if (eventDate.includes("T00:00")) return null;
  return formatTimeRange(eventDate, eventEndDate);
}
