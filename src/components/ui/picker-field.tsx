"use client";

import { XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PickerFieldProps = {
  id?: string;
  /** Leading glyph (calendar, clock) so dates and times scan apart. */
  icon: React.ReactNode;
  /** Formatted value, or `null` to show the placeholder. */
  display: string | null;
  placeholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, an inline clear button shows while there is a value. */
  onClear?: () => void;
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name of the popover dialog ("Choose date"). */
  contentLabel: string;
  contentClassName?: string;
  "aria-invalid"?: boolean;
  children: React.ReactNode;
};

/**
 * The shared shell of `DatePicker` and `TimePicker`: an input-shaped trigger
 * (icon, value or muted placeholder, optional inline clear) that opens the
 * picker in an origin-aware popover. One shell so both read as one family.
 *
 * The trigger keeps the input's border, surface and type so it sits flush
 * with text fields; it rings like a focused input while its popover is open.
 * `<label for>` names the button, so the value is wired as its description.
 */
export function PickerField({
  id,
  icon,
  display,
  placeholder,
  open,
  onOpenChange,
  onClear,
  clearLabel = "Clear",
  disabled = false,
  className,
  contentLabel,
  contentClassName,
  "aria-invalid": ariaInvalid,
  children,
}: PickerFieldProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const valueId = React.useId();
  const showClear = Boolean(onClear && display && !disabled);

  return (
    <div className={cn("relative min-w-0", className)} data-slot="picker-field">
      <Popover onOpenChange={onOpenChange} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-describedby={valueId}
            aria-invalid={ariaInvalid || undefined}
            className={cn(
              "h-9 w-full justify-start gap-2 border-input bg-transparent px-3 text-base font-normal hover:bg-muted/60 hover:text-foreground active:scale-[0.99] md:text-sm dark:bg-input/30 dark:hover:bg-input/50",
              "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/50",
              showClear && "pr-9",
            )}
            disabled={disabled}
            id={id}
            ref={triggerRef}
            variant="outline"
          >
            {icon}
            <span
              className={cn("truncate", !display && "text-muted-foreground")}
              id={valueId}
            >
              {display ?? placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={contentLabel}
          className={cn("p-0", contentClassName)}
        >
          {children}
        </PopoverContent>
      </Popover>
      {showClear ? (
        <Button
          aria-label={clearLabel}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 animate-fade-in rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => {
            onClear?.();
            // The button unmounts with the value; keep keyboard focus in the field.
            triggerRef.current?.focus();
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
