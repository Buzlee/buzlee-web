"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { AdminBusinessSummary } from "@/entities/admin";
import {
  claimDomainMatch,
  useAdminBusinesses,
  useAdminResidents,
  useAdminStatusCounts,
} from "@/entities/admin";
import type { BusinessClaimWithBusiness } from "@/entities/business-claim";
import { useBusinessClaims } from "@/entities/business-claim";
import { DomainPill } from "@/features/admin/components/domain-pill";
import { EmptyState } from "@/features/admin/components/empty-state";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { formatRelativeTime, ownerLabel } from "@/features/admin/lib/format";

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

function ClaimRow({ claim }: { claim: BusinessClaimWithBusiness }) {
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

      {!loading && totalPending === 0 ? (
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
                  <ClaimRow claim={claim} key={claim.id} />
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </>
      )}
    </div>
  );
}
