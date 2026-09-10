"use client";

import { FileText, ImageIcon } from "lucide-react";
import { formatPreviewLine } from "../../lib/format-event-summary";
import type { FlyerDraft } from "../../model/types";

/**
 * Compact preview at the top of the Review / Edit hub: artwork thumb,
 * title, "Fri, Aug 28 · 6:30 PM · The Tap Room" line, category + type chips.
 */
export function FlyerPreviewCard({
  draft,
  categoryName,
}: {
  draft: FlyerDraft;
  categoryName?: string;
}) {
  const thumbUri =
    draft.coverPhoto?.uri ??
    (draft.media?.type === "image" ? draft.media.uri : null);
  const eventCount = draft.events.length;
  const typeLabel =
    draft.flyerType === "multi"
      ? `${eventCount} ${eventCount === 1 ? "event" : "events"}`
      : "Single event";
  const previewLine = formatPreviewLine(draft);
  const PlaceholderIcon = draft.media?.type === "pdf" ? FileText : ImageIcon;

  return (
    <div className="flex gap-4 rounded-lg border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-chart-5">
        {thumbUri ? (
          // biome-ignore lint/performance/noImgElement: object URL / storage URL preview
          <img
            alt="Flyer thumbnail"
            className="h-full w-full object-cover"
            src={thumbUri}
          />
        ) : (
          <PlaceholderIcon className="size-5 text-primary-foreground" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="line-clamp-2 text-lg font-bold text-foreground">
          {draft.title.trim() || "Untitled flyer"}
        </p>
        {previewLine ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {previewLine}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {categoryName ? (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {categoryName}
            </span>
          ) : null}
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {typeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
