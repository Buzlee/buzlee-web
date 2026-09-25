"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { AgeUnit } from "@/entities/flyer/lib/age-restriction";
import { Field } from "@/features/admin/businesses/business-form";
import { cn } from "@/lib/utils";
import type { AgeRestrictionDraft, StepIssues } from "../../model/types";
import { ToggleRow } from "./toggle-row";

const AGE_UNIT_OPTIONS: { value: AgeUnit; label: string }[] = [
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

function AgeBoundField({
  id,
  label,
  description,
  placeholder,
  value,
  unit,
  error,
  onValueChange,
  onUnitChange,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  value: string;
  unit: AgeUnit;
  error?: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: AgeUnit) => void;
  disabled: boolean;
}) {
  const hasValue = value.trim().length > 0;
  return (
    <Field error={error} hint={description} htmlFor={id} label={label}>
      <div className="flex items-center gap-2">
        <Input
          aria-invalid={Boolean(error)}
          className="flex-1"
          disabled={disabled}
          id={id}
          inputMode="numeric"
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          value={value}
        />
        {AGE_UNIT_OPTIONS.map((option) => {
          const active = hasValue && unit === option.value;
          return (
            <button
              aria-pressed={active}
              className={cn(
                "inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
              disabled={disabled}
              key={option.value}
              // Clicking the active unit unselects the bound by clearing its value.
              onClick={() =>
                active ? onValueChange("") : onUnitChange(option.value)
              }
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/**
 * Minimum / maximum age bounds with Months / Years unit chips and a
 * "Set an age range" switch that reveals the upper bound.
 */
export function AgeRestrictionFields({
  value,
  onChange,
  issues,
  disabled = false,
}: {
  value: AgeRestrictionDraft;
  onChange: (patch: Partial<AgeRestrictionDraft>) => void;
  issues: StepIssues;
  disabled?: boolean;
}) {
  const hasMax = value.max.trim().length > 0;
  // A hydrated max means a range; the switch can also open it before a max is typed.
  const [showRange, setShowRange] = useState(hasMax);
  const rangeVisible = showRange || hasMax;

  return (
    <div className="flex flex-col gap-4">
      <AgeBoundField
        description="Youngest age allowed, like 6 months or 21 years."
        disabled={disabled}
        error={issues.ageMin}
        id="age-min"
        label="Minimum age"
        onUnitChange={(minUnit) => onChange({ minUnit })}
        onValueChange={(min) => onChange({ min })}
        placeholder="e.g., 21"
        unit={value.minUnit}
        value={value.min}
      />
      <ToggleRow
        checked={rangeVisible}
        disabled={disabled}
        label="Set an age range"
        onCheckedChange={(show) => {
          setShowRange(show);
          // Leaving range mode drops the upper bound; the minimum is untouched.
          if (!show) onChange({ max: "" });
        }}
      />
      {rangeVisible ? (
        <AgeBoundField
          description="Oldest age allowed, like 12 years."
          disabled={disabled}
          error={issues.ageMax}
          id="age-max"
          label="Maximum age"
          onUnitChange={(maxUnit) => onChange({ maxUnit })}
          onValueChange={(max) => onChange({ max })}
          placeholder="e.g., 12"
          unit={value.maxUnit}
          value={value.max}
        />
      ) : null}
    </div>
  );
}
