"use client";

import { useEffect, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { WEEKDAY_CODES } from "@/entities/flyer/lib/flyer-recurrence";
import { Field } from "@/features/admin/businesses/business-form";
import { formatDateLocal, parseDateLocal } from "@/shared/lib/date-local";
import { formatUntilCount } from "../../lib/format-event-summary";
import type {
  EventDraft,
  RecurrencePreset,
  StepIssues,
  WeekdayCode,
} from "../../model/types";
import { ChoiceChips } from "./choice-chips";
import { ToggleRow } from "./toggle-row";

export type EventScheduleValue = Pick<
  EventDraft,
  | "startDate"
  | "startTime"
  | "endDate"
  | "endTime"
  | "recurrence"
  | "weeklyDays"
  | "recurrenceUntil"
>;

export type EventScheduleLayout = "stacked" | "two-col";
export type EventScheduleUntilMode = "optional" | "required";

const RECURRENCE_OPTIONS: { value: RecurrencePreset; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const WEEKDAY_OPTIONS: { value: WeekdayCode; label: string }[] = [
  { value: "SU", label: "Sun" },
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
];

type UntilChoice = "never" | "on-date";
const UNTIL_OPTIONS: { value: UntilChoice; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "on-date", label: "On date" },
];

const LABELS = {
  stacked: {
    startDate: "Event date",
    endDate: "Event end date",
    startTime: "Event time",
    endTime: "Event end time",
    recurrence: "Recurring event",
    weeklyDays: "Repeats on",
    until: "Repeats until",
    ends: "Ends",
  },
  "two-col": {
    startDate: "Start date",
    endDate: "End date",
    startTime: "Start time",
    endTime: "End time",
    recurrence: "Repeats",
    weeklyDays: "Repeats on",
    until: "Repeats until",
    ends: "Ends",
  },
} as const;

/** Weekday code for a `YYYY-MM-DD` date, used to seed weekly recurrence. */
function weekdayCodeFor(date: string): WeekdayCode | null {
  if (!date) return null;
  return WEEKDAY_CODES[parseDateLocal(date).getDay()] ?? null;
}

/**
 * Schedule fields shared by the single-event Schedule step (stacked layout,
 * "Add end date/time" switches) and the multi-event Event form (two-column
 * layout, end fields always visible). Web port of the app's
 * `EventScheduleFields` over the shadcn `DatePicker` / `TimePicker` (the
 * web stand-ins for the app's date and time spinner sheets).
 */
export function EventScheduleFields({
  idPrefix,
  value,
  onChange,
  layout,
  issues,
  untilMode,
  disabled = false,
}: {
  idPrefix: string;
  value: EventScheduleValue;
  onChange: (patch: Partial<EventDraft>) => void;
  layout: EventScheduleLayout;
  issues: StepIssues;
  untilMode: EventScheduleUntilMode;
  disabled?: boolean;
}) {
  const labels = LABELS[layout];
  const stacked = layout === "stacked";
  const repeating = value.recurrence !== "none";
  const id = (name: string) => `${idPrefix}-${name}`;

  // Stacked layout: the end fields sit behind switches. Seeded from the value
  // so hydrated drafts open with their end fields visible.
  const [endDateOn, setEndDateOn] = useState(() => !!value.endDate);
  const [endTimeOn, setEndTimeOn] = useState(() => !!value.endTime);
  const [untilOn, setUntilOn] = useState(() => !!value.recurrenceUntil);
  useEffect(() => {
    if (value.endDate) setEndDateOn(true);
  }, [value.endDate]);
  useEffect(() => {
    if (value.endTime) setEndTimeOn(true);
  }, [value.endTime]);
  useEffect(() => {
    if (value.recurrenceUntil) setUntilOn(true);
  }, [value.recurrenceUntil]);

  const today = formatDateLocal(new Date());
  // New events start today or later, but an existing event that already
  // began (editing a live series) keeps its own start as the floor so the
  // saved date stays selectable instead of being locked out.
  const earliestStart =
    value.startDate && value.startDate < today ? value.startDate : today;
  const startMinimum = value.startDate || today;
  // End-time slots show the duration from the start while both fall on one day.
  const sameDay = !value.endDate || value.endDate === value.startDate;

  const handleRecurrenceChange = (recurrence: RecurrencePreset) => {
    const patch: Partial<EventDraft> = { recurrence };
    if (recurrence === "weekly" && value.weeklyDays.length === 0) {
      const seed = weekdayCodeFor(value.startDate);
      patch.weeklyDays = seed ? [seed] : [];
    }
    onChange(patch);
  };

  const untilCount = formatUntilCount({
    ...value,
    localId: "",
    serverId: null,
    title: "",
    description: "",
  });

  const startDateField = (
    <Field
      error={issues.startDate}
      htmlFor={id("start-date")}
      label={`${labels.startDate} *`}
    >
      <DatePicker
        aria-invalid={Boolean(issues.startDate)}
        disabled={disabled}
        id={id("start-date")}
        min={earliestStart}
        onChange={(startDate) => onChange({ startDate })}
        value={value.startDate}
      />
    </Field>
  );
  const endDateField = (
    <Field
      error={issues.endDate}
      hint={stacked ? undefined : "Leave blank for a same-day event."}
      htmlFor={id("end-date")}
      label={labels.endDate}
    >
      <DatePicker
        aria-invalid={Boolean(issues.endDate)}
        clearable={!stacked}
        disabled={disabled}
        id={id("end-date")}
        min={startMinimum}
        onChange={(endDate) => onChange({ endDate })}
        placeholder={stacked ? "Select date" : "Same day"}
        value={value.endDate}
      />
    </Field>
  );
  const startTimeField = (
    <Field
      error={issues.startTime}
      hint={stacked ? "Leave blank for an all-day event." : undefined}
      htmlFor={id("start-time")}
      label={labels.startTime}
    >
      <TimePicker
        aria-invalid={Boolean(issues.startTime)}
        clearable
        disabled={disabled}
        id={id("start-time")}
        onChange={(startTime) => onChange({ startTime })}
        placeholder={stacked ? "Select time" : "All day"}
        value={value.startTime}
      />
    </Field>
  );
  const endTimeField = (
    <Field
      error={issues.endTime}
      htmlFor={id("end-time")}
      label={labels.endTime}
    >
      <TimePicker
        aria-invalid={Boolean(issues.endTime)}
        clearable={!stacked}
        disabled={disabled}
        id={id("end-time")}
        onChange={(endTime) => onChange({ endTime })}
        referenceTime={sameDay ? value.startTime : undefined}
        value={value.endTime}
      />
    </Field>
  );

  const untilInput = (
    <DatePicker
      aria-invalid={Boolean(issues.recurrenceUntil)}
      disabled={disabled}
      id={id("until")}
      min={startMinimum}
      onChange={(recurrenceUntil) => onChange({ recurrenceUntil })}
      value={value.recurrenceUntil}
    />
  );

  const untilField =
    untilMode === "required" ? (
      <Field
        error={issues.recurrenceUntil}
        hint={untilCount ?? undefined}
        htmlFor={id("until")}
        label={`${labels.until} *`}
      >
        {untilInput}
      </Field>
    ) : (
      <div className="flex flex-col gap-3">
        <Field htmlFor={id("ends")} label={labels.ends}>
          <ChoiceChips<UntilChoice>
            aria-label={labels.ends}
            disabled={disabled}
            onChange={(choice) => {
              const on = choice === "on-date";
              setUntilOn(on);
              if (!on) onChange({ recurrenceUntil: "" });
            }}
            options={UNTIL_OPTIONS}
            value={untilOn ? "on-date" : "never"}
          />
        </Field>
        {untilOn ? (
          <Field
            error={issues.recurrenceUntil}
            hint={untilCount ?? undefined}
            htmlFor={id("until")}
            label={labels.until}
          >
            {untilInput}
          </Field>
        ) : null}
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      {stacked ? (
        <>
          {startDateField}
          <div className="flex flex-col gap-3">
            <ToggleRow
              checked={endDateOn}
              disabled={disabled}
              label="Add end date"
              onCheckedChange={(on) => {
                setEndDateOn(on);
                if (!on) onChange({ endDate: "" });
              }}
            />
            {endDateOn ? endDateField : null}
          </div>
          {startTimeField}
          <div className="flex flex-col gap-3">
            <ToggleRow
              checked={endTimeOn}
              disabled={disabled}
              label="Add end time"
              onCheckedChange={(on) => {
                setEndTimeOn(on);
                if (!on) onChange({ endTime: "" });
              }}
            />
            {endTimeOn ? endTimeField : null}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {startDateField}
            {endDateField}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {startTimeField}
            {endTimeField}
          </div>
        </>
      )}

      <Field htmlFor={id("recurrence")} label={labels.recurrence}>
        <ChoiceChips<RecurrencePreset>
          aria-label={labels.recurrence}
          disabled={disabled}
          onChange={handleRecurrenceChange}
          options={RECURRENCE_OPTIONS}
          value={value.recurrence}
        />
      </Field>

      {value.recurrence === "weekly" ? (
        <Field
          error={issues.weeklyDays}
          hint="Select one or more days."
          htmlFor={id("weekly-days")}
          label={labels.weeklyDays}
        >
          <ChoiceChips<WeekdayCode>
            aria-label={labels.weeklyDays}
            disabled={disabled}
            minSelected={1}
            multiple
            onChange={(weeklyDays) => onChange({ weeklyDays })}
            options={WEEKDAY_OPTIONS}
            value={value.weeklyDays}
          />
        </Field>
      ) : null}

      {repeating ? untilField : null}
    </div>
  );
}
