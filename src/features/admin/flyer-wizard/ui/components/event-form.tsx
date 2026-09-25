"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  textareaClass,
} from "@/features/admin/businesses/business-form";
import { formatEventSummary } from "../../lib/format-event-summary";
import type { EventDraft, StepIssues } from "../../model/types";
import { EventScheduleFields } from "./event-schedule-fields";

export function SectionLabel({ children }: { children: string }) {
  return (
    <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

/**
 * Controlled form body for one lineup event (multi-event flyers): title,
 * description, two-column schedule fields and the live summary strip.
 */
export function EventForm({
  value,
  onChange,
  issues,
  colorClass,
  disabled = false,
}: {
  value: EventDraft;
  onChange: (patch: Partial<EventDraft>) => void;
  issues: StepIssues;
  /** Tailwind background class for this event's dot. */
  colorClass: string;
  disabled?: boolean;
}) {
  const summary = formatEventSummary(value);
  return (
    <div className="flex flex-col gap-5">
      <Field
        error={issues.eventTitle}
        htmlFor="event-title"
        label="Event title *"
      >
        <Input
          aria-invalid={Boolean(issues.eventTitle)}
          disabled={disabled}
          id="event-title"
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g., Happy Hour, Trivia Night"
          value={value.title}
        />
      </Field>
      <Field htmlFor="event-description" label="Description">
        <textarea
          className={textareaClass}
          disabled={disabled}
          id="event-description"
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What's special about this one?"
          value={value.description}
        />
      </Field>
      <div className="flex flex-col gap-3">
        <SectionLabel>When</SectionLabel>
        <EventScheduleFields
          disabled={disabled}
          idPrefix="event"
          issues={issues}
          layout="two-col"
          onChange={onChange}
          untilMode="required"
          value={value}
        />
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
        <span className={`size-2.5 shrink-0 rounded-full ${colorClass}`} />
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">
          <span className="font-semibold">
            {value.title.trim() || "Untitled event"}
          </span>
          {summary ? (
            <span className="text-muted-foreground"> · {summary}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
