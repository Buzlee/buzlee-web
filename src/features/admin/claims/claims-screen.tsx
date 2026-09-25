"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClaimDomainMatch } from "@/entities/admin";
import { CLAIM_DECLINE_REASONS, claimDomainMatch } from "@/entities/admin";
import type {
  BusinessClaimStatus,
  BusinessClaimWithBusiness,
} from "@/entities/business-claim";
import {
  useApproveBusinessClaim,
  useBusinessClaims,
  useRejectBusinessClaim,
} from "@/entities/business-claim";
import { DomainPill } from "@/features/admin/components/domain-pill";
import { EmptyState } from "@/features/admin/components/empty-state";
import {
  type FilterChipOption,
  FilterChips,
} from "@/features/admin/components/filter-chips";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { SearchInput } from "@/features/admin/components/search-input";
import { TableSkeleton } from "@/features/admin/components/table-skeleton";
import { ConfirmDialog } from "@/features/admin/dialogs/confirm-dialog";
import { RejectDialog } from "@/features/admin/dialogs/reject-dialog";
import {
  formatLongDate,
  formatRelativeTime,
} from "@/features/admin/lib/format";
import {
  StatusChip,
  type StatusChipVariant,
} from "@/features/admin/shell/status-chip";
import { cn } from "@/lib/utils";

const STATUSES: BusinessClaimStatus[] = ["pending", "approved", "rejected"];

const STATUS_LABEL: Record<BusinessClaimStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
};

const STATUS_TO_CHIP: Record<BusinessClaimStatus, StatusChipVariant> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

const EMPTY_COPY: Record<BusinessClaimStatus, string> = {
  pending: "No claim requests waiting for review.",
  approved: "No approved claims yet.",
  rejected: "No declined claims.",
};

type ClaimAction = {
  type: "approve" | "decline";
  claim: BusinessClaimWithBusiness;
};

function claimantName(claim: BusinessClaimWithBusiness): string {
  return claim.contact_name ?? claim.contact_email ?? "Unknown claimant";
}

/** When the decision was made; older rows may predate `reviewed_at`. */
function decidedAt(claim: BusinessClaimWithBusiness): string | null {
  if (claim.status === "pending") return null;
  return claim.reviewed_at ?? claim.updated_at;
}

function domainMatchFor(claim: BusinessClaimWithBusiness) {
  return claimDomainMatch({
    claimEmail: claim.contact_email,
    businessEmail: claim.business?.email ?? null,
    businessWebsite: null,
  });
}

function matchesSearch(search: string, ...fields: (string | null)[]): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}

function reviewHref(businessId: string): string {
  return `/admin/businesses/review?id=${businessId}`;
}

function claimsUrl(claimId: string | null): string {
  return claimId ? `/admin/claims?id=${claimId}` : "/admin/claims";
}

/** Automated trust signal: claimant email domain vs. business email. */
function DomainSignal({ result }: { result: ClaimDomainMatch }) {
  const config = {
    match: {
      icon: CheckCircle2,
      className:
        "bg-[hsl(var(--action-checked-in-soft))] text-[hsl(var(--action-checked-in))]",
      copy: `Contact email matches the listing's domain (${result.claimDomain}).`,
    },
    mismatch: {
      icon: AlertTriangle,
      className: "bg-destructive/10 text-destructive",
      copy: `Contact email domain (${result.claimDomain}) does not match the listing (${result.businessDomain}).`,
    },
    unknown: {
      icon: HelpCircle,
      className: "bg-secondary text-muted-foreground",
      copy: "No automated ownership signal — verify via the contact details below.",
    },
  }[result.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl p-3.5 text-[13px] leading-[18px] font-medium",
        config.className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{config.copy}</span>
    </div>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-b-0">
      <span className="w-[110px] shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm break-words text-foreground">
        {value}
      </span>
    </div>
  );
}

function ClaimPanel({
  claim,
  onAction,
  busy,
}: {
  claim: BusinessClaimWithBusiness;
  onAction: (action: ClaimAction) => void;
  busy: boolean;
}) {
  const name = claimantName(claim);
  const match = domainMatchFor(claim);
  const decided = decidedAt(claim);

  return (
    <aside className="sticky top-0 flex h-svh w-[400px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <InitialsAvatar name={name} rounded="rounded-full" size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold tracking-tight text-foreground">
            {name}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            Requested {formatRelativeTime(claim.created_at)}
          </p>
        </div>
        <StatusChip
          label={STATUS_LABEL[claim.status]}
          variant={STATUS_TO_CHIP[claim.status]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Wants to claim
        </span>
        <Link
          className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-secondary"
          href={reviewHref(claim.business_id)}
        >
          <InitialsAvatar
            imageUrl={claim.business?.logo_url}
            name={claim.business?.name}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {claim.business?.name ?? "Unknown business"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {claim.business?.user_id
                ? "Already has an owner"
                : "Unclaimed, admin-posted"}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <DomainSignal result={match} />

      <div>
        <PanelRow label="Email" value={claim.contact_email ?? "Not provided"} />
        <PanelRow label="Phone" value={claim.contact_phone ?? "Not provided"} />
        <PanelRow
          label="Message"
          value={claim.message ? `“${claim.message}”` : "—"}
        />
        <PanelRow label="Submitted" value={formatLongDate(claim.created_at)} />
        {decided ? (
          <PanelRow
            label={claim.status === "approved" ? "Approved" : "Declined"}
            value={formatLongDate(decided)}
          />
        ) : null}
      </div>

      {claim.status === "rejected" && claim.rejection_reason ? (
        <div className="flex flex-col gap-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3.5">
          <span className="text-[13px] font-medium text-muted-foreground">
            Decline reason
          </span>
          <span className="text-sm text-destructive">
            {claim.rejection_reason}
          </span>
        </div>
      ) : null}

      {claim.status === "pending" ? (
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
          <Button
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            disabled={busy}
            onClick={() => onAction({ type: "approve", claim })}
            type="button"
          >
            Approve claim
          </Button>
          <Button
            className="flex-1"
            disabled={busy}
            onClick={() => onAction({ type: "decline", claim })}
            type="button"
            variant="outline"
          >
            Decline…
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

/**
 * Claims list with Pending / Approved / Declined filter — the history view the
 * Inbox omits. Row click opens a side panel with the full request, the domain
 * signal, and (for decided claims) the decision date and decline reason.
 * `?id=` deep-links straight to one claim's panel (Inbox rows + "Review now").
 */
export function ClaimsScreen() {
  const urlId = useSearchParams().get("id");
  const [filter, setFilter] = useState<BusinessClaimStatus>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(urlId);
  const [claimAction, setClaimAction] = useState<ClaimAction | null>(null);

  // One "all" fetch: claims are low-volume, and it gives per-status counts for
  // free. Mutations invalidate businessClaimKeys.all, which covers this cache.
  const { data: claims, isLoading } = useBusinessClaims();
  const approveClaim = useApproveBusinessClaim();
  const rejectClaim = useRejectBusinessClaim();

  // Open a deep-linked claim under its own status tab. Applied once per id so
  // deciding it here doesn't yank the list to the Approved / Declined tab.
  const appliedDeepLink = useRef<string | null>(null);
  useEffect(() => {
    if (!urlId || !claims || appliedDeepLink.current === urlId) return;
    appliedDeepLink.current = urlId;
    const target = claims.find((claim) => claim.id === urlId);
    if (!target) return;
    setFilter(target.status);
    setSelectedId(target.id);
  }, [urlId, claims]);

  function select(claimId: string | null) {
    setSelectedId(claimId);
    window.history.replaceState(null, "", claimsUrl(claimId));
  }

  const counts = useMemo(() => {
    const result: Record<BusinessClaimStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const claim of claims ?? []) result[claim.status] += 1;
    return result;
  }, [claims]);

  const chips: FilterChipOption<BusinessClaimStatus>[] = STATUSES.map(
    (value) => ({
      value,
      label: STATUS_LABEL[value],
      count: claims ? counts[value] : undefined,
    }),
  );

  const rows = useMemo(() => {
    const list = (claims ?? []).filter(
      (claim) =>
        claim.status === filter &&
        matchesSearch(
          search,
          claim.contact_name,
          claim.contact_email,
          claim.business?.name ?? null,
          claim.rejection_reason,
        ),
    );
    // Pending oldest-first (work the queue in arrival order); decided claims
    // most recently decided first.
    return filter === "pending"
      ? [...list].sort((a, b) => a.created_at.localeCompare(b.created_at))
      : [...list].sort((a, b) =>
          (decidedAt(b) ?? "").localeCompare(decidedAt(a) ?? ""),
        );
  }, [claims, filter, search]);

  const selected = selectedId
    ? (claims?.find((claim) => claim.id === selectedId) ?? null)
    : null;

  function changeFilter(next: BusinessClaimStatus) {
    setFilter(next);
    select(null);
  }

  function handleApproveClaim() {
    const action = claimAction;
    if (!action || approveClaim.isPending) return;
    approveClaim.mutate(action.claim.id, {
      onSuccess: () => {
        toast.success(
          `Approved claim — ${action.claim.business?.name ?? "business"} now has an owner`,
        );
        setClaimAction(null);
      },
      onError: (error) => toast.error(`Approve failed: ${error.message}`),
    });
  }

  function handleDeclineClaim(reason: string) {
    const action = claimAction;
    if (!action || rejectClaim.isPending) return;
    rejectClaim.mutate(
      { claimId: action.claim.id, reason },
      {
        onSuccess: () => {
          toast.success("Claim declined");
          setClaimAction(null);
        },
        onError: (error) => toast.error(`Decline failed: ${error.message}`),
      },
    );
  }

  const busy = approveClaim.isPending || rejectClaim.isPending;

  return (
    <div className="flex min-h-0 flex-1 items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips onChange={changeFilter} options={chips} value={filter} />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">
              {filter === "pending" ? "Oldest first" : "Most recent first"}
            </span>
            <SearchInput
              className="w-64"
              onChange={setSearch}
              placeholder="Search claims"
              value={search}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState
              caption={
                search ? "No claims match your search." : EMPTY_COPY[filter]
              }
              icon={UserCheck}
              title="Nothing here"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14" />
                  <TableHead>Claimant</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Submitted</TableHead>
                  {filter === "pending" ? null : (
                    <TableHead>
                      {filter === "approved" ? "Approved" : "Declined"}
                    </TableHead>
                  )}
                  {filter === "rejected" ? <TableHead>Reason</TableHead> : null}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((claim) => (
                  <TableRow
                    className={cn(
                      "cursor-pointer",
                      claim.id === selectedId && "bg-secondary",
                    )}
                    key={claim.id}
                    onClick={() =>
                      select(claim.id === selectedId ? null : claim.id)
                    }
                  >
                    <TableCell>
                      <InitialsAvatar
                        name={claimantName(claim)}
                        rounded="rounded-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {claimantName(claim)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {claim.contact_email ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {claim.business?.name ?? "Unknown business"}
                    </TableCell>
                    <TableCell>
                      <DomainPill status={domainMatchFor(claim).status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatRelativeTime(claim.created_at)}
                    </TableCell>
                    {filter === "pending" ? null : (
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatRelativeTime(decidedAt(claim))}
                      </TableCell>
                    )}
                    {filter === "rejected" ? (
                      <TableCell className="max-w-[260px] truncate text-muted-foreground">
                        {claim.rejection_reason ?? "—"}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {selected ? (
        <ClaimPanel busy={busy} claim={selected} onAction={setClaimAction} />
      ) : null}

      <ConfirmDialog
        ctaLabel="Approve claim"
        description={
          claimAction
            ? `Assigns ownership of ${claimAction.claim.business?.name ?? "this business"} to ${claimantName(claimAction.claim)} and notifies them by email.`
            : undefined
        }
        onConfirm={handleApproveClaim}
        onOpenChange={(open) => {
          if (!open) setClaimAction(null);
        }}
        open={claimAction?.type === "approve"}
        pending={approveClaim.isPending}
        title={`Approve claim for ${claimAction?.claim.business?.name ?? "business"}?`}
      />
      <RejectDialog
        ctaLabel="Decline claim"
        description="The claimant keeps access to nothing; the business stays unclaimed."
        onConfirm={handleDeclineClaim}
        onOpenChange={(open) => {
          if (!open) setClaimAction(null);
        }}
        open={claimAction?.type === "decline"}
        pending={rejectClaim.isPending}
        reasons={CLAIM_DECLINE_REASONS}
        title={`Decline claim for ${claimAction?.claim.business?.name ?? "business"}?`}
      />
    </div>
  );
}
