import type { ClaimDomainMatchStatus } from "@/entities/admin";
import { StatusChip } from "@/features/admin/shell/status-chip";

const PILL_BY_STATUS = {
  match: { variant: "approved", label: "Domain match" },
  mismatch: { variant: "rejected", label: "No match" },
  unknown: { variant: "deleted", label: "Unverified" },
} as const;

/** Claim-vetting pill: claimant email domain vs business domain. */
export function DomainPill({ status }: { status: ClaimDomainMatchStatus }) {
  const pill = PILL_BY_STATUS[status];
  return <StatusChip label={pill.label} variant={pill.variant} />;
}
