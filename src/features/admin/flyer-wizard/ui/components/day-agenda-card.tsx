"use client";

// PORTED FROM buzlee-app/src/features/flyer-wizard/ui/components/day-agenda-card.tsx — keep in sync; see docs/admin-sync.md
// Web fix: colours are Tailwind classes; the card content cross-fades when
// the selected day changes (`animate-fade-in`, opacity only).

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseDateLocal } from "@/shared/lib/date-local";
import { formatDisplayTime } from "../../lib/format-event-summary";
import type { EventDraft } from "../../model/types";

export type DayAgendaItem = { event: EventDraft; colorClass: string };

export type DayAgendaCardProps = {
  /** `YYYY-MM-DD` */
  date: string;
  items: DayAgendaItem[];
  onSelectEvent: (localId: string) => void;
  onAddEvent: (date: string) => void;
  className?: string;
};

export const UNTITLED_EVENT = "Untitled event";

/** "Fri, Aug 7" */
export function formatAgendaDate(date: string): string {
  return parseDateLocal(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Aug 7" */
export function formatShortDate(date: string): string {
  return parseDateLocal(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "5:00 PM – 7:00 PM", "5:00 PM" or "All day". */
export function formatCompactEventTime(
  event: Pick<EventDraft, "startTime" | "endTime">,
): string {
  if (!event.startTime) return "All day";
  const start = formatDisplayTime(event.startTime);
  return event.endTime
    ? `${start} – ${formatDisplayTime(event.endTime)}`
    : start;
}

/**
 * Accent card beside the lineup calendar listing what happens on the
 * selected day, with a shortcut to add an event on that date.
 */
export function DayAgendaCard({
  date,
  items,
  onSelectEvent,
  onAddEvent,
  className,
}: DayAgendaCardProps) {
  const count = items.length;
  const countLabel =
    count === 0 ? "No events" : `${count} ${count === 1 ? "event" : "events"}`;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg bg-accent p-4 ${className ?? ""}`}
      data-testid="day-agenda-card"
    >
      <div className="flex animate-fade-in flex-col gap-3" key={date}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-accent-foreground">
            {formatAgendaDate(date)}
          </p>
          <span className="text-sm text-muted-foreground">{countLabel}</span>
        </div>

        {count > 0 ? (
          <ul className="-mx-2 flex flex-col">
            {items.map(({ event, colorClass }) => {
              const title = event.title.trim() || UNTITLED_EVENT;
              const time = formatCompactEventTime(event);
              return (
                <li key={event.localId}>
                  <button
                    aria-label={`${title}, ${time}`}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-[background-color,transform,scale] duration-150 ease-out-strong outline-none hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:active:scale-100"
                    onClick={() => onSelectEvent(event.localId)}
                    type="button"
                  >
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${colorClass}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {time}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing scheduled on this day yet.
          </p>
        )}
      </div>

      <Button
        className="w-full bg-background"
        onClick={() => onAddEvent(date)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus />
        Add event on {formatShortDate(date)}
      </Button>
    </div>
  );
}
