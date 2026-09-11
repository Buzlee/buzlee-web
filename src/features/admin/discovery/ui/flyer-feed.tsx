"use client";

import { Newspaper } from "lucide-react";
import { useMemo } from "react";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { EmptyState } from "@/features/admin/components/empty-state";
import { groupFlyersByTimePeriod } from "../lib/group-flyers-by-time-period";
import { FlyerCard } from "./flyer-card";

/**
 * Web port of the app's `DiscoveryFeedList`: flyers grouped into This Week /
 * Next Week / Upcoming (same `groupFlyersByTimePeriod`), rendered as a grid
 * of cards instead of horizontal carousels.
 */
export function FlyerFeed({
  flyers,
  isLoading,
  selectedFlyerId,
  onSelect,
}: {
  flyers: FlyerWithDetails[];
  isLoading: boolean;
  selectedFlyerId: string | null;
  onSelect: (flyer: FlyerWithDetails) => void;
}) {
  const sections = useMemo(() => groupFlyersByTimePeriod(flyers), [flyers]);

  if (isLoading && flyers.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">Loading flyers…</p>;
  }

  if (flyers.length === 0) {
    return (
      <EmptyState
        caption="No live flyers match these filters."
        icon={Newspaper}
        title="No flyers found"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      {sections.map((section) => (
        <section className="flex flex-col gap-3" key={section.title}>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {section.title}
            <span className="ml-2 text-sm font-medium text-muted-foreground tabular-nums">
              {section.data.length}
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.data.map((flyer) => (
              <FlyerCard
                flyer={flyer}
                key={flyer.id}
                onSelect={onSelect}
                selected={flyer.id === selectedFlyerId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
