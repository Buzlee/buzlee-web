"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  claimDomainMatch,
  useAdminBusinesses,
  useAdminResidents,
  useAdminStatusCounts,
} from "@/entities/admin";
import { useBusinessClaims } from "@/entities/business-claim";
import { DomainPill } from "@/features/admin/components/domain-pill";
import { formatRelativeTime } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";
import { businessTriageItem, claimTriageItem } from "./model/triage-queue";
import { useTriageQueue } from "./model/use-triage-queue";
import { LiveStats } from "./ui/live-stats";
import { NextUpCard } from "./ui/next-up-card";
import {
  INBOX_SURFACE,
  QueueAvatar,
  QueueRow,
  QueueSection,
} from "./ui/queue-list";
import { useInboxShortcuts } from "./ui/use-inbox-shortcuts";

function byOldest<T extends { created_at: string }>(a: T, b: T): number {
  return a.created_at.localeCompare(b.created_at);
}

const SKELETON_ROWS = ["s1", "s2", "s3"] as const;

/** Placeholder with the hero + one group's geometry, so nothing jumps. */
function InboxSkeleton() {
  return (
    // <output> carries the implicit status role for the loading announcement.
    <output className="flex flex-col gap-9">
      <span className="sr-only">Loading inbox…</span>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-5 w-40" />
        <div className={INBOX_SURFACE}>
          <div className="flex items-center gap-4 p-5">
            <Skeleton className="size-14 rounded-[13px]" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3.5 w-36" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-5 w-44" />
        <div className={INBOX_SURFACE}>
          {SKELETON_ROWS.map((key, index) => (
            <div
              className={cn(
                "flex min-h-16 items-center gap-3 px-4 py-3",
                index > 0 && "border-t border-border/40",
              )}
              key={key}
            >
              <Skeleton className="size-10 rounded-[10px]" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </output>
  );
}

/** The queue is the whole job — clearing it gets a calm, centered moment. */
function CaughtUp() {
  return (
    <div className="flex flex-col items-center px-6 pt-10 pb-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-action-checked-in-soft">
        <CheckCircle2
          aria-hidden
          className="size-8 text-action-checked-in"
          strokeWidth={2}
        />
      </span>
      <h2 className="mt-5 text-[22px] leading-7 font-semibold tracking-[-0.02em] text-foreground">
        You&apos;re all caught up
      </h2>
      <p className="mt-2 max-w-sm text-[15px] leading-5.5 text-muted-foreground">
        No businesses or claims are waiting on you. New submissions show up here
        the moment they arrive.
      </p>
      <Button
        asChild
        className="mt-6 h-9 rounded-full px-4 text-[13px] font-semibold"
        variant="outline"
      >
        <Link href="/admin/flyers">Browse live flyers</Link>
      </Button>
    </div>
  );
}

function InboxError({
  message,
  onRetry,
}: {
  message: string | undefined;
  onRetry: () => void;
}) {
  return (
    <div
      className={cn(INBOX_SURFACE, "flex items-start gap-3 p-5")}
      role="alert"
    >
      <AlertTriangle
        aria-hidden
        className="mt-0.5 size-5 shrink-0 text-destructive"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-foreground">
          Couldn&apos;t load your inbox
        </p>
        {message ? (
          <p className="mt-0.5 text-[13px] wrap-break-word text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
      <Button
        className="rounded-full"
        onClick={onRetry}
        size="sm"
        type="button"
        variant="outline"
      >
        Try again
      </Button>
    </div>
  );
}

/**
 * Admin Inbox (web port of buzlee-app `app/(admin)/index.tsx`): one
 * prioritized review queue — pending businesses and claim requests — led by
 * a "Next up" card, with live totals demoted to a quiet strip. Rows only
 * navigate; decisions happen on the business review / claim panel.
 */
export function InboxScreen() {
  const router = useRouter();
  const businessesQuery = useAdminBusinesses({ status: "pending" });
  const claimsQuery = useBusinessClaims("pending");
  const { data: statusCounts } = useAdminStatusCounts();
  const { data: residents } = useAdminResidents();
  const triage = useTriageQueue();

  // Oldest first — work the queue in arrival order.
  const businesses = useMemo(
    () => [...(businessesQuery.data ?? [])].sort(byOldest),
    [businessesQuery.data],
  );
  const claims = useMemo(
    () => [...(claimsQuery.data ?? [])].sort(byOldest),
    [claimsQuery.data],
  );

  const loading = businessesQuery.isPending || claimsQuery.isPending;
  const failed =
    (businessesQuery.isError && !businessesQuery.data) ||
    (claimsQuery.isError && !claimsQuery.data);
  const needsReview = businesses.length + claims.length;

  useInboxShortcuts(!loading && triage.nextUp !== null, {
    onReview: () => {
      if (triage.nextUp) router.push(triage.nextUp.href);
    },
    onSkip: triage.skipCurrent,
  });

  function ageLabel(id: string, createdAt: string): string {
    return triage.isSkipped(id) ? "Skipped" : formatRelativeTime(createdAt);
  }

  return (
    // Anchored to the page title's leading edge (like every admin page); the
    // max width keeps rows a comfortable reading length on wide screens.
    <div className="flex w-full max-w-3xl flex-col gap-9 px-6 pt-8 pb-16">
      {failed ? (
        <InboxError
          message={(businessesQuery.error ?? claimsQuery.error)?.message}
          onRetry={() => {
            void businessesQuery.refetch();
            void claimsQuery.refetch();
          }}
        />
      ) : loading ? (
        <InboxSkeleton />
      ) : needsReview === 0 ? (
        <CaughtUp />
      ) : (
        <>
          <NextUpCard onSkip={triage.skipCurrent} state={triage} />

          {businesses.length > 0 ? (
            <QueueSection
              count={businesses.length}
              id="inbox-approvals"
              seeAllHref="/admin/businesses?status=pending"
              title="Business approvals"
            >
              {businesses.map((business) => (
                <QueueRow
                  age={ageLabel(business.id, business.created_at)}
                  href={businessTriageItem(business).href}
                  key={business.id}
                  leading={
                    <QueueAvatar
                      imageUrl={business.logo_url}
                      name={business.name}
                    />
                  }
                  meta={
                    [business.category_name, business.town_name]
                      .filter(Boolean)
                      .join(" · ") || "Uncategorized"
                  }
                  title={business.name}
                />
              ))}
            </QueueSection>
          ) : null}

          {claims.length > 0 ? (
            <QueueSection
              count={claims.length}
              id="inbox-claims"
              seeAllHref="/admin/claims"
              title="Claim requests"
            >
              {claims.map((claim) => {
                const item = claimTriageItem(claim);
                return (
                  <QueueRow
                    accessory={
                      <DomainPill
                        status={
                          claimDomainMatch({
                            claimEmail: claim.contact_email,
                            businessEmail: claim.business?.email ?? null,
                            businessWebsite: null,
                          }).status
                        }
                      />
                    }
                    age={ageLabel(claim.id, claim.created_at)}
                    href={item.href}
                    key={claim.id}
                    leading={
                      <QueueAvatar
                        name={item.title}
                        shape="circle"
                        tone="accent"
                      />
                    }
                    meta={`Claiming ${claim.business?.name ?? "a business"}`}
                    title={item.title}
                  />
                );
              })}
            </QueueSection>
          ) : null}
        </>
      )}

      <LiveStats
        stats={[
          {
            label: "Businesses",
            value: statusCounts?.businesses.approved,
            href: "/admin/businesses?status=approved",
          },
          {
            label: "Live flyers",
            value: statusCounts ? (statusCounts.flyers.live ?? 0) : undefined,
            href: "/admin/flyers",
          },
          {
            label: "Residents",
            value: residents?.length,
            href: "/admin/residents",
          },
        ]}
      />
    </div>
  );
}
