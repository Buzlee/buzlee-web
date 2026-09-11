"use client";

import { AlertCircle, ChevronDown, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/features/admin/shell/status-chip";
import { cn } from "@/lib/utils";
import { ROW_STATUS_CHIP, type RowStatus } from "./row-status";

export interface ReviewRowField {
  label: string;
  value: string;
}

export interface ReviewRowCardProps {
  rowNumber: number;
  title: string;
  meta?: string;
  status: RowStatus;
  /** Error text (needs-fix), skip reason, or resolution warnings. */
  message?: string;
  fields: ReviewRowField[];
  onEdit?: () => void;
  onRemove?: () => void;
}

/**
 * One CSV row on the review screen (web port of mobile `ReviewRowCard`):
 * collapsed it reads like a list row (row-number circle, title, meta,
 * trailing status); expanded it shows the parsed values and edit/remove
 * actions. The circle carries the spreadsheet row number so the screen and
 * the source file stay in lockstep.
 */
export function ReviewRowCard({
  rowNumber,
  title,
  meta,
  status,
  message,
  fields,
  onEdit,
  onRemove,
}: ReviewRowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const chip = ROW_STATUS_CHIP[status];

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm",
        status === "needs-fix" ? "border-destructive/40" : "border-border",
      )}
    >
      <button
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
        onClick={() => setExpanded((open) => !open)}
        type="button"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground tabular-nums">
          {rowNumber}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">
            {title}
          </span>
          {meta ? (
            <span className="truncate text-xs text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </span>
        <StatusChip label={chip.label} variant={chip.variant} />
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div className="flex flex-col gap-4 px-4 pb-4">
          {message ? (
            status === "needs-fix" ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {message}
              </p>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="flex-1 text-sm text-muted-foreground">
                  {message}
                </p>
              </div>
            )
          ) : null}

          {fields.length > 0 ? (
            <dl className="grid grid-cols-[minmax(0,140px)_1fr] gap-x-4 gap-y-2">
              {fields.map((field) => (
                <div className="contents" key={field.label}>
                  <dt className="text-xs text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="min-w-0 text-sm break-words text-foreground">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {onEdit || onRemove ? (
            <div className="flex gap-2">
              {onEdit ? (
                <Button
                  onClick={onEdit}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Pencil />
                  Edit row
                </Button>
              ) : null}
              {onRemove ? (
                <Button
                  className="text-destructive hover:text-destructive"
                  onClick={onRemove}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
