"use client";

import { ArrowLeft, Map as MapIcon, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { formatFlyerWhen } from "@/features/admin/lib/flyer-when";
import { StatusChip } from "@/features/admin/shell/status-chip";
import { coordinateFromFlyerLocation } from "../lib/map-coordinates";
import { FlyerCard, FlyerThumbnail } from "./flyer-card";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-border py-2.5 last:border-b-0">
      <span className="w-[84px] shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm break-words text-foreground">
        {value}
      </span>
    </div>
  );
}

/**
 * Read-only flyer detail — the web stand-in for the app's `FlyerSheet` on
 * the discovery screens. Moderation stays on the flyer review page, which
 * "Open review" links to (mobile parity: the admin map is oversight only).
 */
export function FlyerDetailPanel({
  flyer,
  onClose,
  onBack,
  onShowOnMap,
}: {
  flyer: FlyerWithDetails;
  onClose: () => void;
  /** Present when the panel was opened from a co-located stack. */
  onBack?: () => void;
  /** Present in list view; switches to the map and focuses this flyer. */
  onShowOnMap?: (flyer: FlyerWithDetails) => void;
}) {
  const tags = flyer.tags ?? [];
  const hasCoordinate = coordinateFromFlyerLocation(flyer.location) !== null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        {onBack ? (
          <Button
            aria-label="Back to list"
            onClick={onBack}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <ArrowLeft />
          </Button>
        ) : (
          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Flyer
          </span>
        )}
        <Button
          aria-label="Close"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <FlyerThumbnail
          className="aspect-[4/3] w-full rounded-xl border border-border"
          flyer={flyer}
        />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {flyer.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip variant="live" />
            {flyer.visibility === "members_only" ? (
              <StatusChip label="Members only" variant="deleted" />
            ) : null}
          </div>
        </div>

        <div>
          <Fact label="Business" value={flyer.business?.name ?? "Unknown"} />
          <Fact label="When" value={formatFlyerWhen(flyer)} />
          <Fact
            label="Where"
            value={
              [flyer.location_name, flyer.location_address, flyer.town?.name]
                .filter(Boolean)
                .join(" · ") || "Not provided"
            }
          />
          <Fact
            label="Category"
            value={flyer.category?.name ?? "Not specified"}
          />
          {tags.length > 0 ? (
            <Fact
              label="Tags"
              value={tags.map((tag) => `#${tag.name}`).join("  ")}
            />
          ) : null}
        </div>

        {flyer.description ? (
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {flyer.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-4">
        {onShowOnMap && hasCoordinate ? (
          <Button
            className="flex-1"
            onClick={() => onShowOnMap(flyer)}
            type="button"
            variant="outline"
          >
            <MapIcon />
            Show on map
          </Button>
        ) : null}
        <Button
          asChild
          className="flex-1 bg-foreground text-background hover:bg-foreground/90"
        >
          <Link href={`/admin/flyers/review?id=${flyer.id}`}>Open review</Link>
        </Button>
      </div>
    </div>
  );
}

/** Co-located pins: the app's `ColocatedFlyersSheet` — pick one from the stack. */
export function FlyerStackPanel({
  flyers,
  onSelect,
  onClose,
}: {
  flyers: FlyerWithDetails[];
  onSelect: (flyer: FlyerWithDetails) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">
          {flyers.length} flyers at this location
        </span>
        <Button
          aria-label="Close"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {flyers.map((flyer) => (
          <FlyerCard
            flyer={flyer}
            key={flyer.id}
            onSelect={onSelect}
            selected={false}
          />
        ))}
      </div>
    </div>
  );
}
