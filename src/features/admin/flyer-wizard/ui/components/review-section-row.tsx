"use client";

import {
  AlertTriangle,
  Check,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One row of the Review / Edit hub section list: icon · title + summary ·
 * ✓ (complete) or ⚠ (incomplete) · chevron. Clicking jumps to that step.
 */
export function ReviewSectionRow({
  icon: Icon,
  title,
  summary,
  complete,
  onClick,
  disabled = false,
}: {
  icon: LucideIcon;
  title: string;
  summary: string;
  complete: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={`${title}: ${summary}. ${complete ? "Complete" : "Needs attention"}`}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-foreground" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <span className="line-clamp-2 text-sm text-muted-foreground">
          {summary}
        </span>
      </span>
      {complete ? (
        <Check className="size-4 shrink-0 text-action-checked-in" />
      ) : (
        <AlertTriangle className="size-4 shrink-0 text-destructive" />
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
