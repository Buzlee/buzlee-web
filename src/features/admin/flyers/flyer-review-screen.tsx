"use client";

import { ChevronRight, ImageOff, Newspaper } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminFlyerSummary } from "@/entities/admin";
import {
  FLYER_TAKEDOWN_REASONS,
  useAdminFlyer,
  useAdminRejectFlyer,
} from "@/entities/admin";
import { formatFlyerEventLine } from "@/entities/flyer/lib";
import { EmptyState } from "@/features/admin/components/empty-state";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { RejectDialog } from "@/features/admin/dialogs/reject-dialog";
import { FlyerLineup } from "@/features/admin/flyers/flyer-lineup";
import { formatRelativeTime } from "@/features/admin/lib/format";
import { PageHeader } from "@/features/admin/shell/page-header";
import { StatusChip } from "@/features/admin/shell/status-chip";
import { cn } from "@/lib/utils";

function FactRow({
  label,
  value,
  link = false,
}: {
  label: string;
  value: React.ReactNode;
  link?: boolean;
}) {
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-b-0">
      <span className="w-[110px] shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 text-sm break-words",
          link ? "text-accent-foreground" : "text-foreground",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

/**
 * "When" for a single-event flyer. Prefers the flyer_events row (recurrence-
 * aware: "Fridays · 5–7 PM · through Aug 28"); legacy rows without child
 * events fall back to the flat summary columns. Same rule as the mobile
 * `flyer-review/[id]` screen.
 */
function formatEventWhen(flyer: AdminFlyerSummary): string {
  const event = flyer.events[0];
  if (event) return formatFlyerEventLine(event);
  const start = new Date(flyer.event_date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const parts = [start];
  if (flyer.event_time) parts.push(flyer.event_time);
  if (flyer.event_end_date && flyer.event_end_date !== flyer.event_date) {
    parts.push(
      `– ${new Date(flyer.event_end_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    );
  }
  return parts.join(" · ");
}

function FlyerHero({ flyer }: { flyer: AdminFlyerSummary }) {
  return (
    <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[14px] border border-border bg-secondary">
      {flyer.media_url ? (
        // biome-ignore lint/performance/noImgElement: remote storage asset; plain img avoids loader failures
        <img
          alt={flyer.title}
          className="h-full w-full object-cover"
          src={flyer.media_url}
        />
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <ImageOff className="size-7 text-muted-foreground" />
          <span className="text-[13px] text-muted-foreground">
            No flyer image
          </span>
        </div>
      )}
    </div>
  );
}

export function FlyerReviewScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { data: flyer, isLoading, error } = useAdminFlyer(id);
  const rejectFlyer = useAdminRejectFlyer();
  const [takeDownOpen, setTakeDownOpen] = useState(false);

  const isLive = flyer?.status === "live" || flyer?.status === "approved";
  const isTakenDown = flyer?.status === "rejected";
  // Same rule as FlyerSheet/FlyerCard: a 'multi' flyer with one event reads as single.
  const isMulti =
    flyer?.flyer_type === "multi" && (flyer?.events.length ?? 0) > 1;

  function handleTakeDown(reason: string) {
    if (!flyer || rejectFlyer.isPending) return;
    rejectFlyer.mutate(
      { flyerId: flyer.id, reason },
      {
        onSuccess: () => {
          setTakeDownOpen(false);
          toast.success(`Took down “${flyer.title}”`, {
            description: "It is no longer visible to residents.",
          });
        },
        onError: (err) => toast.error(`Take down failed: ${err.message}`),
      },
    );
  }

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        title={
          <span className="flex items-center gap-2 truncate">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/admin/flyers"
            >
              Flyers
            </Link>
            {flyer ? (
              <>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{flyer.title}</span>
              </>
            ) : null}
          </span>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!id || error || (!isLoading && !flyer) ? (
          <EmptyState
            action={
              <Button
                onClick={() => router.push("/admin/flyers")}
                type="button"
                variant="outline"
              >
                Back to flyers
              </Button>
            }
            caption={
              error ? "Failed to load flyer." : "That flyer no longer exists."
            }
            icon={Newspaper}
            title={error ? "Something went wrong" : "Flyer not found"}
          />
        ) : !flyer ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
            <div className="aspect-[4/3] w-full animate-pulse rounded-[14px] bg-secondary" />
            <div className="h-7 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6 pb-10">
            <FlyerHero flyer={flyer} />

            <div className="flex flex-col gap-2">
              <h1 className="text-[22px] font-bold tracking-tight text-foreground">
                {flyer.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusChip
                  label={flyer.status === "expired" ? "Expired" : undefined}
                  variant={
                    isTakenDown ? "takenDown" : isLive ? "live" : "pending"
                  }
                />
                <span className="text-[13px] text-muted-foreground">
                  Posted {formatRelativeTime(flyer.created_at)}
                </span>
              </div>
            </div>

            <Link
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-secondary/60"
              href={`/admin/businesses/review?id=${flyer.business_id}`}
            >
              <InitialsAvatar
                imageUrl={flyer.business_logo}
                name={flyer.business_name}
                size={36}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {flyer.business_name ?? "Unknown business"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  View business
                </span>
              </span>
              <ChevronRight className="size-[18px] shrink-0 text-muted-foreground" />
            </Link>

            {isMulti ? <FlyerLineup events={flyer.events} /> : null}

            <div className="border-t border-border">
              {!isMulti ? (
                <FactRow label="When" value={formatEventWhen(flyer)} />
              ) : null}
              <FactRow
                label="Where"
                value={
                  [flyer.location_address, flyer.town_name]
                    .filter(Boolean)
                    .join(" · ") || "Not provided"
                }
              />
              <FactRow
                label="Category"
                value={flyer.category_name ?? "Not specified"}
              />
              {flyer.external_link ? (
                <FactRow
                  label="Link"
                  link
                  value={
                    <a
                      className="underline-offset-2 hover:underline"
                      href={flyer.external_link}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {flyer.external_link}
                    </a>
                  }
                />
              ) : null}
              <FactRow label="Details" value={flyer.description ?? "—"} />
            </div>
          </div>
        )}
      </div>

      {flyer && isLive ? (
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Taking down hides this flyer from residents immediately.
          </p>
          <Button
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={rejectFlyer.isPending}
            onClick={() => setTakeDownOpen(true)}
            type="button"
            variant="outline"
          >
            Take down…
          </Button>
        </div>
      ) : null}

      <RejectDialog
        ctaLabel="Take down flyer"
        description="It disappears from residents immediately. The business gets the reason by email."
        onConfirm={handleTakeDown}
        onOpenChange={setTakeDownOpen}
        open={takeDownOpen}
        pending={rejectFlyer.isPending}
        reasons={FLYER_TAKEDOWN_REASONS}
        title="Take down this flyer?"
      />
    </div>
  );
}
