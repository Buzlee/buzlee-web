"use client";

import { cn } from "@/lib/utils";
import type { FlyerType } from "../../model/types";
import { FLYER_TYPE_COPY } from "../../model/wizard-steps";

const OPTIONS: FlyerType[] = ["single", "multi"];

/**
 * Single event / Multiple events segmented choice with the per-type helper
 * copy from `FLYER_TYPE_COPY`.
 */
export function FlyerTypeChoice({
  value,
  onChange,
  disabled = false,
}: {
  value: FlyerType;
  onChange: (value: FlyerType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
        {OPTIONS.map((option) => {
          const active = option === value;
          return (
            <button
              aria-pressed={active}
              className={cn(
                "h-9 rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              disabled={disabled}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              {FLYER_TYPE_COPY[option].label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {FLYER_TYPE_COPY[value].helper}
      </p>
    </div>
  );
}
