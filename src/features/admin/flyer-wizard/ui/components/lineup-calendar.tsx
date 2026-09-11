"use client";

// PORTED FROM buzlee-app/src/features/flyer-wizard/ui/components/lineup-calendar.tsx — keep in sync; see docs/admin-sync.md
// Web fix: renders over the shadcn `Calendar` (react-day-picker) instead of
// the app's hand-rolled `MonthCalendar`; markers are Tailwind colour classes.

import { useMemo } from "react";
import type { DayButton } from "react-day-picker";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { expandOccurrenceStartDays } from "@/entities/flyer/lib/flyer-occurrences";
import {
  daysInMonthGrid,
  formatDateLocal,
  monthKey,
  parseDateLocal,
} from "@/shared/lib/date-local";
import { eventColorClassAt } from "../../lib/event-colors";
import { eventDraftToSchedule } from "../../lib/serialize-flyer-draft";
import type { EventDraft } from "../../model/types";

const MAX_MARKER_DOTS = 3;

export type LineupCalendarProps = {
  events: EventDraft[];
  /** `YYYY-MM` */
  visibleMonth: string;
  selectedDate: string | null;
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
  className?: string;
};

/** `YYYY-MM-DD` → colour classes of the events starting that day, over the visible grid. */
export function buildLineupMarkers(
  events: EventDraft[],
  visibleMonth: string,
): Record<string, string[]> {
  const grid = daysInMonthGrid(visibleMonth);
  if (grid.length === 0) return {};
  const rangeStart = grid[0];
  const rangeEnd = grid[grid.length - 1];
  const markers: Record<string, string[]> = {};

  events.forEach((event, index) => {
    if (!event.startDate) return;
    const color = eventColorClassAt(index);
    for (const day of expandOccurrenceStartDays(
      eventDraftToSchedule(event),
      rangeStart,
      rangeEnd,
    )) {
      markers[day] ??= [];
      markers[day].push(color);
    }
  });

  return markers;
}

/**
 * Month calendar of the lineup: every day on which one of the draft events
 * starts gets a dot in that event's colour. Selecting a day drives the
 * agenda card beside it.
 */
export function LineupCalendar({
  events,
  visibleMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
  className,
}: LineupCalendarProps) {
  const markers = useMemo(
    () => buildLineupMarkers(events, visibleMonth),
    [events, visibleMonth],
  );

  // Closure over the marker map so each day cell can paint its dots without
  // a context; recreated only when the markers change.
  const MarkedDayButton = useMemo(() => {
    function MarkedDayButton({
      children,
      ...props
    }: React.ComponentProps<typeof DayButton>) {
      const key = formatDateLocal(props.day.date);
      const colors = markers[key] ?? [];
      const eventCount = colors.length;
      const label = props.day.date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      return (
        <CalendarDayButton
          {...props}
          aria-label={
            eventCount === 0
              ? label
              : `${label}, ${eventCount} ${eventCount === 1 ? "event" : "events"}`
          }
        >
          {children}
          <div aria-hidden className="flex h-1.5 items-center gap-0.5">
            {colors.slice(0, MAX_MARKER_DOTS).map((color, i) => (
              <span
                className={`size-1.5 rounded-full opacity-100 ${color}`}
                data-testid="calendar-marker-dot"
                // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional and identical apart from colour
                key={`${color}-${i}`}
              />
            ))}
          </div>
        </CalendarDayButton>
      );
    }
    return MarkedDayButton;
  }, [markers]);

  return (
    <Calendar
      className={className}
      components={{ DayButton: MarkedDayButton }}
      mode="single"
      month={parseDateLocal(`${visibleMonth}-01`)}
      onMonthChange={(date) => onMonthChange(monthKey(date))}
      onSelect={(date) => onSelectDate(formatDateLocal(date))}
      required
      selected={selectedDate ? parseDateLocal(selectedDate) : undefined}
    />
  );
}
