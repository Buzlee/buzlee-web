"use client";

import { cn } from "@/lib/utils";

export type ChoiceOption<T extends string> = { value: T; label: string };

type SingleProps<T extends string> = {
  multiple?: false;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  "aria-label"?: string;
};

type MultiProps<T extends string> = {
  multiple: true;
  options: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  /** Refuse to deselect below this count. */
  minSelected?: number;
  /** Ignore selections beyond this count. */
  maxSelected?: number;
  disabled?: boolean;
  "aria-label"?: string;
};

/**
 * Web port of the app's `ChoiceChips`: single-select (radio-like) or
 * multi-select toggle chips.
 */
export function ChoiceChips<T extends string>(
  props: SingleProps<T> | MultiProps<T>,
) {
  const { options, disabled } = props;
  const label = props["aria-label"];

  function isActive(value: T): boolean {
    return props.multiple ? props.value.includes(value) : props.value === value;
  }

  function toggle(value: T) {
    if (props.multiple) {
      const active = props.value.includes(value);
      if (active) {
        if (props.value.length <= (props.minSelected ?? 0)) return;
        props.onChange(props.value.filter((item) => item !== value));
      } else {
        if (
          props.maxSelected !== undefined &&
          props.value.length >= props.maxSelected
        )
          return;
        props.onChange([...props.value, value]);
      }
      return;
    }
    props.onChange(value);
  }

  return (
    <div className="flex flex-wrap gap-2" title={label}>
      {options.map((option) => {
        const active = isActive(option.value);
        return (
          <button
            aria-pressed={active}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
            disabled={disabled}
            key={option.value}
            onClick={() => toggle(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
