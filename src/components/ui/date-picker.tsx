"use client";

import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { PickerField } from "@/components/ui/picker-field";
import { formatDateLocal, parseDateLocal } from "@/shared/lib/date-local";

const displayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export type DatePickerProps = {
  id?: string;
  /** Local `YYYY-MM-DD`, or `""` when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Inclusive `YYYY-MM-DD` lower bound; earlier days are disabled. */
  min?: string;
  placeholder?: string;
  /** Inline clear button while a date is set (optional fields only). */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

/**
 * Date field over the shadcn `Calendar` in a popover (the web stand-in for
 * the app's date spinner sheet). Picking a day commits and closes. The
 * calendar opens on the selected — or earliest allowed — month with focus
 * on that day, so arrow keys work at once; six fixed weeks keep the popover
 * the same height from month to month.
 */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  placeholder = "Select date",
  clearable = false,
  disabled = false,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseDateLocal(value) : undefined;
  const minDate = min ? parseDateLocal(min) : undefined;
  // Never lock out the selected month when it predates `min` (editing a live event).
  const startMonth =
    minDate && selected && selected < minDate ? selected : minDate;

  return (
    <PickerField
      aria-invalid={ariaInvalid}
      className={className}
      clearLabel="Clear date"
      contentClassName="w-auto"
      contentLabel="Choose date"
      disabled={disabled}
      display={selected ? displayFormat.format(selected) : null}
      icon={<CalendarIcon className="text-muted-foreground" />}
      id={id}
      onClear={clearable ? () => onChange("") : undefined}
      onOpenChange={setOpen}
      open={open}
      placeholder={placeholder}
    >
      <Calendar
        autoFocus
        className="[--cell-size:--spacing(9)]"
        defaultMonth={selected ?? minDate}
        disabled={minDate ? { before: minDate } : undefined}
        fixedWeeks
        mode="single"
        onSelect={(date) => {
          onChange(formatDateLocal(date));
          setOpen(false);
        }}
        required
        selected={selected}
        startMonth={startMonth}
      />
    </PickerField>
  );
}
