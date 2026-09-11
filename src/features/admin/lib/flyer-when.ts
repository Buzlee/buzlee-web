import {
  type FlyerEventSchedule,
  formatFlyerEventLine,
  formatFlyerEventsSummaryLine,
} from "@/entities/flyer/lib";

type FlyerWhenSource = {
  events: FlyerEventSchedule[];
  event_date: string;
  event_time: string | null;
  event_end_date: string | null;
};

/**
 * "When" line for a flyer. Multi-event lineups summarise ("3 events · Aug
 * 4–28"); single events prefer the flyer_events row (recurrence-aware:
 * "Fridays · 5–7 PM · through Aug 28"); legacy rows without child events
 * fall back to the flat summary columns. Same rule as the mobile
 * `flyer-review/[id]` screen and flyer cards.
 */
export function formatFlyerWhen(flyer: FlyerWhenSource): string {
  if (flyer.events.length > 1)
    return formatFlyerEventsSummaryLine(flyer.events);
  const event = flyer.events[0];
  if (event) return formatFlyerEventLine(event);
  const start = new Date(flyer.event_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const parts = [start];
  if (flyer.event_time) parts.push(flyer.event_time);
  if (flyer.event_end_date && flyer.event_end_date !== flyer.event_date) {
    parts.push(
      `– ${new Date(flyer.event_end_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    );
  }
  return parts.join(" · ");
}
