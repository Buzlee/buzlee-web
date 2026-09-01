import { cn } from "@/lib/utils";

/**
 * 24px status pill for admin tables and detail views. Soft token-based
 * backgrounds with darker readable text, mirroring the buzlee-app admin UI.
 */
const STATUS_CHIP_VARIANTS = {
  pending: {
    label: "Pending",
    className: "bg-primary/15 text-[hsl(33_80%_28%)]",
  },
  live: {
    label: "Live",
    className: "bg-[hsl(var(--action-checked-in-soft))] text-teal-800",
  },
  approved: {
    label: "Approved",
    className: "bg-[hsl(var(--action-checked-in-soft))] text-teal-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-red-800",
  },
  takenDown: {
    label: "Taken down",
    className: "bg-destructive/10 text-red-800",
  },
  deleted: {
    label: "Deleted",
    className: "bg-secondary text-muted-foreground",
  },
} as const;

export type StatusChipVariant = keyof typeof STATUS_CHIP_VARIANTS;

export function StatusChip({
  variant,
  label,
  className,
}: {
  variant: StatusChipVariant;
  /** Override the default label (e.g. "Expired" on the rejected style). */
  label?: string;
  className?: string;
}) {
  const config = STATUS_CHIP_VARIANTS[variant];

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        config.className,
        className,
      )}
    >
      {label ?? config.label}
    </span>
  );
}
