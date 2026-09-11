"use client";

import { ImageOff, Lock } from "lucide-react";
import { getFlyerImageUrl } from "@/entities/flyer/lib/flyer-helper";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { formatFlyerWhen } from "@/features/admin/lib/flyer-when";
import { cn } from "@/lib/utils";

/** Cover / artwork thumbnail shared by the card and the detail panel. */
export function FlyerThumbnail({
  flyer,
  className,
}: {
  flyer: FlyerWithDetails;
  className?: string;
}) {
  const url = getFlyerImageUrl(flyer);
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-secondary",
        className,
      )}
    >
      {url ? (
        // biome-ignore lint/performance/noImgElement: remote storage asset; plain img avoids loader failures
        <img alt="" className="h-full w-full object-cover" src={url} />
      ) : (
        <ImageOff className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}

/**
 * Compact flyer row for the discovery feed and the map's flyer list —
 * the web stand-in for the app's `FlyerCard` (artwork, title, business,
 * when, members-only badge).
 */
export function FlyerCard({
  flyer,
  selected,
  onSelect,
}: {
  flyer: FlyerWithDetails;
  selected: boolean;
  onSelect: (flyer: FlyerWithDetails) => void;
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-left shadow-sm transition-colors hover:bg-secondary/60",
        selected ? "border-foreground" : "border-border",
      )}
      onClick={() => onSelect(flyer)}
      type="button"
    >
      <FlyerThumbnail
        className="aspect-[3/4] w-14 shrink-0 rounded-lg"
        flyer={flyer}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {flyer.title}
          </span>
          {flyer.visibility === "members_only" ? (
            <Lock
              aria-label="Members only"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          ) : null}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {flyer.business?.name ?? "Unknown business"}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {formatFlyerWhen(flyer)}
        </span>
      </span>
    </button>
  );
}
