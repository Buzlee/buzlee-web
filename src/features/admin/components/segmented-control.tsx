"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = { value: T; label: string };

/**
 * Two-to-four way view switcher (Map / List). One thumb slides between
 * equal-width segments — a transform, so the map underneath never reflows.
 * Tab semantics (tablist / tab) with roving focus and arrow keys; the
 * switched content should be `role="tabpanel"` with `id={idBase}` and
 * `aria-labelledby={`${idBase}-tab-${value}`}`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  idBase,
  "aria-label": ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Id of the tabpanel this control switches; tabs get `${idBase}-tab-${value}`. */
  idBase: string;
  "aria-label": string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const count = options.length;
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  function move(delta: number) {
    const next = options[(index + delta + count) % count];
    if (next.value === value) return;
    onChange(next.value);
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)
      ?.focus();
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "relative isolate grid h-9 shrink-0 rounded-full bg-secondary p-0.5",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        } else if (event.key === "Home") {
          event.preventDefault();
          move(-index);
        } else if (event.key === "End") {
          event.preventDefault();
          move(count - 1 - index);
        }
      }}
      ref={groupRef}
      role="tablist"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 rounded-full bg-white shadow-[0_1px_2px_rgb(15_23_42/0.12),0_0_0_0.5px_rgb(15_23_42/0.06)] transition-transform duration-200 ease-out-strong motion-reduce:transition-none dark:bg-card"
        style={{
          width: `calc((100% - 4px) / ${count})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            aria-controls={idBase}
            aria-selected={checked}
            className={cn(
              "relative z-10 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap outline-none transition-colors duration-150 ease-out-strong focus-visible:ring-2 focus-visible:ring-ring/50",
              checked
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-value={option.value}
            id={`${idBase}-tab-${option.value}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="tab"
            tabIndex={checked ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
