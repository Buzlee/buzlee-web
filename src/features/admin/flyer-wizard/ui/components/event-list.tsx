"use client";

import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eventColorClassAt } from "../../lib/event-colors";
import { formatEventSummary } from "../../lib/format-event-summary";
import type { EventDraft } from "../../model/types";

const DEFAULT_EMPTY_HINT =
  "No events yet. Add the first one to build your lineup.";
const UNTITLED_EVENT = "Untitled event";

/**
 * "All events" rows of a multi-event lineup plus the outline "Add event" button.
 */
export function EventList({
  events,
  onSelectEvent,
  onAddEvent,
  emptyHint = DEFAULT_EMPTY_HINT,
  disabled = false,
}: {
  events: EventDraft[];
  onSelectEvent: (localId: string) => void;
  onAddEvent: () => void;
  emptyHint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyHint}
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {events.map((event, index) => {
            const title = event.title.trim() || UNTITLED_EVENT;
            const summary = formatEventSummary(event) || "Set a date";
            return (
              <li key={event.localId}>
                <button
                  aria-label={`${title}, ${summary}`}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50",
                  )}
                  disabled={disabled}
                  onClick={() => onSelectEvent(event.localId)}
                  type="button"
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${eventColorClassAt(index)}`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {title}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {summary}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        className="w-full"
        disabled={disabled}
        onClick={onAddEvent}
        type="button"
        variant="outline"
      >
        <Plus />
        Add event
      </Button>
    </div>
  );
}
