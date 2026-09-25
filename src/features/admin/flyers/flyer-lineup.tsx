"use client";

import { Repeat } from "lucide-react";
import { useMemo } from "react";
import {
  type EventTimeStatus,
  formatFlyerEventLine,
  formatFlyerEventsSummaryLine,
  getEventOccurrenceWindow,
  getEventTimeStatus,
  groupEventsByHorizon,
  parseRecurrenceFrequency,
} from "@/entities/flyer/lib";
import type { FlyerEvent } from "@/entities/flyer/model/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Partial<
  Record<EventTimeStatus, { label: string; className: string }>
> = {
  live: {
    label: "Live now",
    className: "text-[hsl(var(--action-checked-in))]",
  },
  today: { label: "Today", className: "text-foreground" },
  ended: { label: "Ended", className: "text-muted-foreground" },
};

/**
 * Read-only lineup for the admin flyer-review screen (multi-event flyers).
 * Web port of buzlee-app `features/admin-flyer-review/ui/AdminFlyerLineup`:
 * horizon chapters (Today · This week · month · Ended) mirroring the resident
 * lineup, every event listed — moderation needs the whole published lineup.
 */
export function FlyerLineup({
  events,
  now: nowProp,
}: {
  /** Ordered flyer_events rows (sort_order, then starts_at). */
  events: FlyerEvent[];
  /** Injectable clock for tests. */
  now?: Date;
}) {
  // Stable per mount so the horizon grouping does not shift mid-review.
  const now = useMemo(() => nowProp ?? new Date(), [nowProp]);
  const groups = useMemo(
    () => groupEventsByHorizon(events, now),
    [events, now],
  );
  const summary = useMemo(() => formatFlyerEventsSummaryLine(events), [events]);
  const [count, ...range] = summary.split(" · ");

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-[13px] font-semibold text-muted-foreground">
          Lineup · {count}
        </h2>
        {range.length > 0 ? (
          <span className="text-[13px] text-muted-foreground">
            {range.join(" · ")}
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {groups.map((group, groupIndex) => (
          <div key={group.key}>
            <div
              className={cn(
                "flex items-baseline gap-2 bg-secondary/60 px-4 py-1.5",
                groupIndex > 0 && "border-t border-border",
              )}
            >
              <span className="text-xs font-semibold text-muted-foreground">
                {group.label}
              </span>
              <span className="text-xs font-medium text-muted-foreground/60 tabular-nums">
                {group.events.length}
              </span>
            </div>
            <ul>
              {group.events.map((event, index) => (
                <LineupRow
                  ended={group.key === "past"}
                  event={event}
                  key={event.id}
                  now={now}
                  showSeparator={index < group.events.length - 1}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function LineupRow({
  event,
  now,
  ended,
  showSeparator,
}: {
  event: FlyerEvent;
  now: Date;
  ended: boolean;
  showSeparator: boolean;
}) {
  const window = getEventOccurrenceWindow(event, now);
  const recurring = parseRecurrenceFrequency(event.recurrence_rule) !== null;
  // Rows in the Ended chapter already read as ended (header + dimmed) — no per-row label.
  const status = ended
    ? undefined
    : STATUS_LABEL[getEventTimeStatus(event, now)];
  const laneTop = recurring
    ? window.start.toLocaleDateString("en-US", { weekday: "short" })
    : window.start.toLocaleDateString("en-US", { month: "short" });
  const line = formatFlyerEventLine(event);

  return (
    <li
      aria-label={`${event.title}, ${line}`}
      className={cn(
        "relative flex items-start gap-3 px-4 py-3",
        ended && "opacity-50",
      )}
    >
      {/* Date lane — fixed width so titles align across rows */}
      <div className="flex w-11 shrink-0 flex-col items-center rounded-[10px] bg-secondary py-1.5">
        <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {laneTop}
        </span>
        {recurring ? (
          <Repeat className="mt-1 size-3.5 text-foreground" strokeWidth={2} />
        ) : (
          <span className="text-lg leading-6 font-bold text-foreground">
            {window.start.getDate()}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start gap-2">
          <span className="flex-1 text-[15px] leading-5 font-semibold text-foreground">
            {event.title}
          </span>
          {status ? (
            <span
              className={cn(
                "shrink-0 text-xs leading-5 font-semibold",
                status.className,
              )}
            >
              {status.label}
            </span>
          ) : null}
        </div>
        <span className="text-[13px] leading-[18px] text-muted-foreground">
          {line}
        </span>
        {event.description ? (
          <p className="mt-0.5 line-clamp-3 text-[13px] leading-[18px] text-foreground/80">
            {event.description}
          </p>
        ) : null}
        {event.check_in_count > 0 ? (
          <span className="mt-0.5 text-xs text-muted-foreground">
            {event.check_in_count} checked in
          </span>
        ) : null}
      </div>

      {showSeparator ? (
        <span className="absolute right-0 bottom-0 left-[72px] h-px bg-border" />
      ) : null}
    </li>
  );
}
