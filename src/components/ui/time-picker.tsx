"use client";

import { CheckIcon, ClockIcon } from "lucide-react";
import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PickerField } from "@/components/ui/picker-field";
import { cn } from "@/lib/utils";

const MINUTES_PER_DAY = 24 * 60;
/** Where the list opens when there is no value or start time to anchor on. */
const DEFAULT_ANCHOR = "12:00";

const pad = (n: number) => String(n).padStart(2, "0");

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** `19:30` → "7:30 PM". */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${pad(minutes)} ${hours < 12 ? "AM" : "PM"}`;
}

/** 90 → "1 hr 30 min". */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

/** "7:30 P.M." → "730pm". */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s:.]/g, "");
}

/** What a slot answers to when typed: "730pm", "0730pm", "1930", plus "7pm", "noon", "midnight" on the hour. */
function searchKeys(time: string): string[] {
  const [hours, minutes] = time.split(":").map(Number);
  const h12 = hours % 12 || 12;
  const meridiem = hours < 12 ? "am" : "pm";
  const keys = [
    `${h12}${pad(minutes)}${meridiem}`,
    `${pad(h12)}${pad(minutes)}${meridiem}`,
    `${pad(hours)}${pad(minutes)}`,
  ];
  if (minutes === 0) keys.push(`${h12}${meridiem}`);
  if (time === "12:00") keys.push("noon");
  if (time === "00:00") keys.push("midnight");
  return keys;
}

/**
 * Reads a typed time ("7:05p", "705", "19:05") as `HH:mm` candidates, so any
 * minute can be entered, not just the listed slots. A bare 1–12 hour could
 * be either half of the day, so it yields both.
 */
function parseTypedTime(query: string): string[] {
  const match = /^(\d{1,2})(\d{2})?([ap])?m?$/.exec(normalize(query));
  if (!match) return [];
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3];
  if (minutes > 59) return [];
  if (meridiem) {
    if (hours < 1 || hours > 12) return [];
    const offset = meridiem === "p" ? 12 : 0;
    return [fromMinutes(((hours % 12) + offset) * 60 + minutes)];
  }
  if (hours > 23) return [];
  if (hours === 0 || hours > 12) return [fromMinutes(hours * 60 + minutes)];
  return [
    fromMinutes((hours % 12) * 60 + minutes),
    fromMinutes(((hours % 12) + 12) * 60 + minutes),
  ];
}

/** Every `step`-minute slot, plus the value when it is off-grid (e.g. 7:05 PM set in the app). */
function timeSlots(step: number, value: string): string[] {
  const slots = Array.from(
    { length: Math.ceil(MINUTES_PER_DAY / step) },
    (_, i) => fromMinutes(i * step),
  );
  if (value && !slots.includes(value)) slots.push(value);
  // `HH:mm` sorts lexically in time order.
  return slots.sort();
}

function matchTimes(slots: string[], query: string): string[] {
  const needle = normalize(query);
  if (!needle) return slots;
  const matches = new Set(parseTypedTime(query));
  for (const slot of slots) {
    if (searchKeys(slot).some((key) => key.startsWith(needle))) {
      matches.add(slot);
    }
  }
  return [...matches].sort();
}

/** The value, else an hour after the start (the likeliest end), else midday. */
function anchorTime(
  value: string,
  referenceTime: string | undefined,
  step: number,
): string {
  if (value) return value;
  if (!referenceTime) return DEFAULT_ANCHOR;
  const suggested = Math.ceil((toMinutes(referenceTime) + 60) / step) * step;
  return fromMinutes(Math.min(suggested, MINUTES_PER_DAY - step));
}

export type TimePickerProps = {
  id?: string;
  /** 24-hour `HH:mm` (seconds are ignored), or `""` when unset. */
  value: string;
  onChange: (value: string) => void;
  /** Same-day start time: later slots show the duration from it. */
  referenceTime?: string;
  /** Minutes between listed slots; any minute can still be typed. */
  step?: number;
  placeholder?: string;
  /** Inline clear button while a time is set (optional fields only). */
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

/**
 * Time field over a shadcn combobox (Popover + Command) — the web stand-in
 * for the app's time spinner. The list opens centred on the current time
 * (or an hour past the start, for an end time); typing filters it and also
 * accepts any exact time ("7:05p", "1930"). Enter or a click commits.
 */
export function TimePicker({
  id,
  value,
  onChange,
  referenceTime,
  step = 15,
  placeholder = "Select time",
  clearable = false,
  disabled = false,
  className,
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const time = value.slice(0, 5);

  return (
    <PickerField
      aria-invalid={ariaInvalid}
      className={className}
      clearLabel="Clear time"
      contentClassName="w-(--radix-popover-trigger-width) min-w-60"
      contentLabel="Choose time"
      disabled={disabled}
      display={time ? formatTime(time) : null}
      icon={<ClockIcon className="text-muted-foreground" />}
      id={id}
      onClear={clearable ? () => onChange("") : undefined}
      onOpenChange={setOpen}
      open={open}
      placeholder={placeholder}
    >
      <TimeList
        onSelect={(next) => {
          onChange(next);
          setOpen(false);
        }}
        referenceTime={referenceTime?.slice(0, 5) || undefined}
        step={step}
        value={time}
      />
    </PickerField>
  );
}

function TimeList({
  value,
  referenceTime,
  step,
  onSelect,
}: {
  value: string;
  referenceTime: string | undefined;
  step: number;
  onSelect: (time: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const listRef = React.useRef<HTMLDivElement>(null);
  const slots = React.useMemo(() => timeSlots(step, value), [step, value]);
  const shown = React.useMemo(() => matchTimes(slots, query), [slots, query]);
  const anchor = anchorTime(value, referenceTime, step);
  const reference = referenceTime ? toMinutes(referenceTime) : null;

  // Open with the anchor mid-list rather than pinned to an edge. This is
  // placement, not motion — it lands before first paint, no smooth scroll.
  React.useLayoutEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>(`[data-time="${anchor}"]`);
    if (list && item) {
      list.scrollTop =
        item.offsetTop - (list.clientHeight - item.offsetHeight) / 2;
    }
  }, [anchor]);

  return (
    <Command defaultValue={anchor} shouldFilter={false}>
      <CommandInput
        onValueChange={setQuery}
        placeholder="Type a time, e.g. 7:30p"
        value={query}
      />
      <CommandList className="relative max-h-64" ref={listRef}>
        <CommandEmpty>Try “7:30p” or “19:30”.</CommandEmpty>
        <CommandGroup>
          {shown.map((slot) => {
            const duration =
              reference === null ? 0 : toMinutes(slot) - reference;
            const chosen = slot === value;
            return (
              <CommandItem
                className={cn("tabular-nums", chosen && "font-semibold")}
                data-time={slot}
                key={slot}
                onSelect={onSelect}
                value={slot}
              >
                {formatTime(slot)}
                {duration > 0 ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {formatDuration(duration)}
                  </span>
                ) : null}
                {chosen ? (
                  <CheckIcon className="ml-auto text-accent-foreground" />
                ) : null}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
