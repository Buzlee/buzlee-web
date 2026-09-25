import type { StatusChipVariant } from "@/features/admin/shell/status-chip";

/**
 * Row status for the batch review screen (mobile `status-pill.tsx`). The
 * web renders these with the dashboard's shared `StatusChip`, mapping each
 * onto the closest existing semantic variant so no new colour tokens are
 * introduced.
 */
export type RowStatus =
  | "ready"
  | "skipped"
  | "needs-fix"
  | "uploaded"
  | "failed";

export const ROW_STATUS_CHIP: Record<
  RowStatus,
  { variant: StatusChipVariant; label: string }
> = {
  ready: { variant: "approved", label: "Ready" },
  skipped: { variant: "deleted", label: "Skipped" },
  "needs-fix": { variant: "rejected", label: "Needs fix" },
  uploaded: { variant: "live", label: "Uploaded" },
  failed: { variant: "rejected", label: "Failed" },
};
