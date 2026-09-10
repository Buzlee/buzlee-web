"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { type AdminFlyerSummary, useAdminFlyers } from "@/entities/admin";
import type { BusinessStatus } from "@/entities/business/model/types";
import {
  formatFlyerEventLine,
  formatFlyerEventsSummaryLine,
} from "@/entities/flyer/lib";
import {
  StatusChip,
  type StatusChipVariant,
} from "@/features/admin/shell/status-chip";

/** "3 events · Aug 4–28" for a lineup, the event line for a single event. */
function flyerScheduleLabel(flyer: AdminFlyerSummary): string | null {
  const events = flyer.events ?? [];
  if (flyer.flyer_type === "multi" && events.length > 1) {
    return formatFlyerEventsSummaryLine(events);
  }
  return events[0] ? formatFlyerEventLine(events[0]) : null;
}

const CHIP_BY_STATUS: Partial<Record<string, StatusChipVariant>> = {
  pending: "pending",
  live: "live",
  approved: "approved",
  rejected: "takenDown",
};

/**
 * Web port of the app's `AdminBusinessFlyersPanel`: the business's flyers with
 * Create / Edit / View. Only approved businesses can have flyers.
 */
export function BusinessFlyersPanel({
  businessId,
  businessStatus,
}: {
  businessId: string;
  businessStatus: BusinessStatus;
}) {
  const canManageFlyers = businessStatus === "approved";

  return (
    <section className="mt-8 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Flyers
        </h3>
        {canManageFlyers ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/flyers/new?business=${businessId}`}>
              Create flyer
            </Link>
          </Button>
        ) : null}
      </div>
      {canManageFlyers ? (
        <BusinessFlyersList businessId={businessId} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Flyer management is only available after the business is approved.
        </p>
      )}
    </section>
  );
}

/** Mounted only for approved businesses so the query is always scoped to one business. */
function BusinessFlyersList({ businessId }: { businessId: string }) {
  const { data: flyers, isLoading } = useAdminFlyers({ businessId });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (!flyers || flyers.length === 0) {
    return <p className="text-sm text-muted-foreground">No flyers yet.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {flyers.map((flyer) => {
        const schedule = flyerScheduleLabel(flyer);
        const chip = CHIP_BY_STATUS[flyer.status] ?? null;
        return (
          <li className="flex items-center gap-3 px-4 py-3" key={flyer.id}>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {flyer.title}
                </p>
                {chip ? (
                  <StatusChip variant={chip} />
                ) : (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground capitalize">
                    {flyer.status}
                  </span>
                )}
              </div>
              {schedule ? (
                <p className="truncate text-xs text-muted-foreground">
                  {schedule}
                </p>
              ) : null}
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/flyers/review?id=${flyer.id}`}>View</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/flyers/edit?id=${flyer.id}`}>Edit</Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
