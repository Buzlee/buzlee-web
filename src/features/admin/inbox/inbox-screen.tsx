"use client";

import { CheckCircle2, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminBusinessSummary } from "@/entities/admin";
import {
  claimDomainMatch,
  useAdminBusinesses,
  useAdminResidents,
  useAdminStatusCounts,
} from "@/entities/admin";
import type { BusinessClaimWithBusiness } from "@/entities/business-claim";
import {
  useApproveBusinessClaim,
  useBusinessClaims,
  useRejectBusinessClaim,
} from "@/entities/business-claim";
import { DomainPill } from "@/features/admin/components/domain-pill";
import { EmptyState } from "@/features/admin/components/empty-state";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { TableSkeleton } from "@/features/admin/components/table-skeleton";
import { ConfirmDialog } from "@/features/admin/dialogs/confirm-dialog";
import { RejectDialog } from "@/features/admin/dialogs/reject-dialog";
import { formatRelativeTime, ownerLabel } from "@/features/admin/lib/format";

/** Quick-pick reasons for declining a business claim (web-only copy). */
const CLAIM_DECLINE_REASONS = [
  "Could not verify ownership",
  "Business already claimed",
  "Contact info does not match",
  "Other",
] as const;

type ClaimAction = {
  type: "approve" | "decline";
  claim: BusinessClaimWithBusiness;
};

function reviewHref(businessId: string): string {
  return `/admin/businesses/review?id=${businessId}`;
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-5 py-3">
        <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {title} · <span className="text-foreground">{count}</span>
        </h2>
      </header>
      {children}
    </section>
  );
}

function ReviewButton({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-secondary"
      href={href}
    >
      Review
      <ChevronRight className="size-3.5" />
    </Link>
  );
}

function ApprovalRow({ business }: { business: AdminBusinessSummary }) {
  const meta = [business.category_name, business.town_name]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <InitialsAvatar imageUrl={business.logo_url} name={business.name} />
      <span className="w-60 truncate text-sm font-semibold text-foreground">
        {business.name}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {meta || "—"}
      </span>
      <span className="hidden w-28 text-sm text-muted-foreground lg:block">
        {ownerLabel(business.user_id)}
      </span>
      <span className="w-20 text-right text-sm whitespace-nowrap text-muted-foreground">
        {formatRelativeTime(business.created_at)}
      </span>
      <ReviewButton href={reviewHref(business.id)} />
    </li>
  );
}

function ClaimRow({
  claim,
  onAction,
}: {
  claim: BusinessClaimWithBusiness;
  onAction: (action: ClaimAction) => void;
}) {
  const match = claimDomainMatch({
    claimEmail: claim.contact_email,
    businessEmail: claim.business?.email ?? null,
    businessWebsite: null,
  });

  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <InitialsAvatar
        name={claim.contact_name ?? claim.contact_email}
        rounded="rounded-full"
      />
      <span className="w-60 truncate text-sm font-semibold text-foreground">
        {claim.contact_name ?? claim.contact_email ?? "Unknown claimant"}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        Claiming{" "}
        <span className="font-medium text-foreground">
          {claim.business?.name ?? "a business"}
        </span>
      </span>
      <span className="hidden lg:block">
        <DomainPill status={match.status} />
      </span>
      <span className="w-20 text-right text-sm whitespace-nowrap text-muted-foreground">
        {formatRelativeTime(claim.created_at)}
      </span>
      <ReviewButton href={reviewHref(claim.business_id)} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions for claim by ${claim.contact_name ?? claim.contact_email ?? "claimant"}`}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => onAction({ type: "approve", claim })}
          >
            Approve claim…
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onAction({ type: "decline", claim })}
            variant="destructive"
          >
            Decline claim…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-end px-6 first:pl-0 last:pr-0">
      <span className="text-[22px] font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function InboxScreen() {
  const [claimAction, setClaimAction] = useState<ClaimAction | null>(null);
  const approveClaim = useApproveBusinessClaim();
  const rejectClaim = useRejectBusinessClaim();
  const { data: statusCounts } = useAdminStatusCounts();
  const { data: pendingBusinesses } = useAdminBusinesses({ status: "pending" });
  const { data: pendingClaims } = useBusinessClaims("pending");
  const { data: residents } = useAdminResidents();

  const approvals = [...(pendingBusinesses ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const claims = pendingClaims ?? [];
  const totalPending = approvals.length + claims.length;
  const loading =
    pendingBusinesses === undefined || pendingClaims === undefined;

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

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-[64px] leading-none font-extrabold tracking-tight text-primary tabular-nums">
              {loading ? "—" : totalPending}
            </span>
            <span className="text-lg font-semibold text-foreground">
              need your review
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {approvals.length} business approval
            {approvals.length === 1 ? "" : "s"} · {claims.length} claim request
            {claims.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex divide-x divide-border">
          <StatBlock
            label="approved businesses"
            value={String(statusCounts?.businesses.approved ?? "—")}
          />
          <StatBlock
            label="live flyers"
            value={String(statusCounts?.flyers.live ?? "—")}
          />
          <StatBlock
            label="residents"
            value={residents ? String(residents.length) : "—"}
          />
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableSkeleton rows={5} />
        </div>
      ) : totalPending === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <EmptyState
            caption="No pending businesses or claim requests right now."
            icon={CheckCircle2}
            iconClassName="bg-[hsl(var(--action-checked-in-soft))] text-[hsl(var(--action-checked-in))]"
            title="You're all caught up"
          />
        </div>
      ) : (
        <>
          {approvals.length > 0 ? (
            <SectionCard count={approvals.length} title="Business approvals">
              <ul className="divide-y divide-border">
                {approvals.map((business) => (
                  <ApprovalRow business={business} key={business.id} />
                ))}
              </ul>
            </SectionCard>
          ) : null}
          {claims.length > 0 ? (
            <SectionCard count={claims.length} title="Claim requests">
              <ul className="divide-y divide-border">
                {claims.map((claim) => (
                  <ClaimRow
                    claim={claim}
                    key={claim.id}
                    onAction={setClaimAction}
                  />
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </>
      )}

      <ConfirmDialog
        ctaLabel="Approve claim"
        description={
          claimAction
            ? `Assigns ownership of ${claimAction.claim.business?.name ?? "this business"} to ${claimAction.claim.contact_name ?? claimAction.claim.contact_email ?? "the claimant"} and notifies them by email.`
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
