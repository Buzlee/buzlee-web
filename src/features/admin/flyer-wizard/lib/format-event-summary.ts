// PORTED FROM buzlee-app/src/features/flyer-wizard/lib/format-event-summary.ts — keep in sync; see docs/admin-sync.md
import {
  formatFlyerEventLine,
  formatFlyerEventsSummaryLine,
} from "@/entities/flyer/lib/flyer-helper";
import { countEventOccurrences } from "@/entities/flyer/lib/flyer-occurrences";
import { WEEKDAY_LABEL_BY_CODE } from "@/entities/flyer/lib/flyer-recurrence";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { composeAddressWithUnit } from "@/entities/location";
import { parseDateLocal } from "@/shared/lib/date-local";
import type { EventDraft, FlyerDraft } from "../model/types";
import { eventDraftToSchedule } from "./serialize-flyer-draft";

const SEP = " · ";

function datedEvents(events: EventDraft[]): EventDraft[] {
  return events.filter((event) => !!event.startDate);
}

/** "Sat, Aug 15 · 10 AM–12 PM", "Fridays · 5–7 PM · through Aug 28"; '' when undated. */
export function formatEventSummary(event: EventDraft): string {
  if (!event.startDate) return "";
  return formatFlyerEventLine(eventDraftToSchedule(event));
}

/** "Aug 4–28 · 3 events" (range first). Undated events are not counted. */
export function formatLineupRange(events: EventDraft[]): string {
  const dated = datedEvents(events);
  const summary = formatFlyerEventsSummaryLine(dated.map(eventDraftToSchedule));
  return summary.split(SEP).reverse().join(SEP);
}

/** Place segment of the preview line: venue name, else the composed address. */
export function formatDraftPlace(
  draft: Pick<FlyerDraft, "location" | "locationName">,
): string {
  if (draft.locationName.trim()) return draft.locationName.trim();
  if (!draft.location) return "";
  return composeAddressWithUnit(
    draft.location.formatted_address,
    draft.location.unit,
  );
}

function formatShortWeekdayDate(date: string): string {
  return parseDateLocal(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Preview-card line under the title:
 *   single → "Fri, Aug 28 · 6:30 PM · The Tap Room"
 *   multi  → "3 events · Aug 4–28 · The Tap Room"
 */
export function formatPreviewLine(draft: FlyerDraft): string {
  const parts: string[] = [];

  if (draft.flyerType === "single") {
    const event = draft.events[0];
    if (event?.startDate) {
      parts.push(formatShortWeekdayDate(event.startDate));
      if (event.startTime) parts.push(formatDisplayTime(event.startTime));
    }
  } else {
    const dated = datedEvents(draft.events);
    if (dated.length > 0)
      parts.push(formatFlyerEventsSummaryLine(dated.map(eventDraftToSchedule)));
  }

  const place = formatDraftPlace(draft);
  if (place) parts.push(place);
  return parts.join(SEP);
}

/**
 * "4 Fridays" / "12 days" / "3 months" for a bounded series; null when the
 * event does not repeat, has no end, or is undated.
 */
export function formatUntilCount(event: EventDraft): string | null {
  if (event.recurrence === "none" || !event.recurrenceUntil || !event.startDate)
    return null;
  const count = countEventOccurrences(eventDraftToSchedule(event));
  if (count == null) return null;

  const plural = (noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;
  switch (event.recurrence) {
    case "daily":
      return plural("day");
    case "monthly":
      return plural("month");
    case "weekly": {
      if (event.weeklyDays.length === 1)
        return plural(WEEKDAY_LABEL_BY_CODE[event.weeklyDays[0]]);
      return plural("time");
    }
    default:
      return null;
  }
}

/**
 * Edit hub subtitle: "Live since Aug 14 · 96 views · 8 saves. Changes go live as soon as you save."
 */
export function formatLiveSubtitle(
  flyer: Pick<FlyerWithDetails, "live_at" | "view_count" | "save_count">,
): string {
  const parts: string[] = [];
  if (flyer.live_at) {
    const since = new Date(flyer.live_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    parts.push(`Live since ${since}`);
  }
  const views = flyer.view_count ?? 0;
  const saves = flyer.save_count ?? 0;
  parts.push(`${views} ${views === 1 ? "view" : "views"}`);
  parts.push(`${saves} ${saves === 1 ? "save" : "saves"}`);
  return `${parts.join(SEP)}. Changes go live as soon as you save.`;
}

/** "Fri, Aug 28, 2026" or the 'Select date' placeholder. */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "Select date";
  return parseDateLocal(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "6:30 PM" or the 'Select time' placeholder. */
export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return "Select time";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
