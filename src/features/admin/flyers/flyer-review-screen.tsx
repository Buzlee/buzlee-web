"use client";

import {
  ChevronRight,
  ImageOff,
  Map as MapIcon,
  Newspaper,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminFlyerSummary } from "@/entities/admin";
import {
  FLYER_TAKEDOWN_REASONS,
  useAdminFlyer,
  useAdminRejectFlyer,
} from "@/entities/admin";
import { EmptyState } from "@/features/admin/components/empty-state";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { RejectDialog } from "@/features/admin/dialogs/reject-dialog";
import { discoveryMapHref } from "@/features/admin/discovery/lib/discovery-href";
import { FlyerArtwork } from "@/features/admin/flyers/flyer-artwork";
import { FlyerLineup } from "@/features/admin/flyers/flyer-lineup";
import { formatFlyerWhen } from "@/features/admin/lib/flyer-when";
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
    <div className="flex gap-4 border-b border-border/60 py-3 last:border-b-0">
      <span className="w-[96px] shrink-0 text-[13px] leading-5 font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 text-sm leading-5 break-words",
          link ? "text-accent-foreground" : "text-foreground",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

/**
 * Artwork column. On desktop it stays pinned while the facts scroll; below
 * `lg` it sits above them. The whole poster is always visible (contained,
 * never cropped) — moderation needs to see what residents see.
 */
function FlyerHero({ flyer }: { flyer: AdminFlyerSummary }) {
  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <FlyerArtwork
        alt={flyer.title}
        className="aspect-[4/3] w-full rounded-2xl lg:aspect-auto lg:min-h-64"
        imgClassName="lg:max-h-[calc(100svh-220px)]"
        src={flyer.media_type === "image" ? flyer.media_url : null}
        fallback={
          <div className="flex flex-col items-center gap-1.5">
            <ImageOff className="size-7 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">
              {flyer.media_url ? "PDF flyer" : "No flyer image"}
            </span>
          </div>
        }
      />
    </div>
  );
}

/** Same two-column geometry as the loaded page, so nothing jumps. */
function FlyerReviewSkeleton() {
  return (
    <output className={LAYOUT}>
      <span className="sr-only">Loading flyer…</span>
      <Skeleton className="aspect-[4/3] w-full rounded-2xl lg:aspect-[4/5]" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </output>
  );
}

const LAYOUT =
  "mx-auto grid w-full max-w-5xl gap-6 px-6 pt-6 pb-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-10 lg:px-8";

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
        actions={
          flyer ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/flyers/edit?id=${flyer.id}`}>Edit flyer</Link>
            </Button>
          ) : undefined
        }
        title={
          <span className="flex items-center gap-2 truncate">
            <Link
              className="rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
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
          <FlyerReviewSkeleton />
        ) : (
          <div className={LAYOUT}>
            <FlyerHero flyer={flyer} />

            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">
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
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.04)] outline-none transition-[background-color,transform,scale] duration-150 ease-out-strong hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:active:scale-100 dark:bg-card"
                href={`/admin/businesses/review?id=${flyer.business_id}`}
              >
                <InitialsAvatar
                  imageUrl={flyer.business_logo}
                  name={flyer.business_name}
                  rounded="rounded-[10px]"
                  size={40}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-5 font-semibold text-foreground">
                    {flyer.business_name ?? "Unknown business"}
                  </span>
                  <span className="block text-[13px] leading-5 text-muted-foreground">
                    View business
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform duration-150 ease-out-strong group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>

              {isMulti ? <FlyerLineup events={flyer.events} /> : null}

              <section aria-label="Flyer details">
                {!isMulti ? (
                  <FactRow label="When" value={formatFlyerWhen(flyer)} />
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
                <FactRow
                  label="Details"
                  value={
                    flyer.description ? (
                      <span className="whitespace-pre-line">
                        {flyer.description}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
              </section>
            </div>
          </div>
        )}
      </div>

      {flyer && isLive ? (
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-6 py-3.5">
          <p className="hidden text-[13px] text-muted-foreground sm:block">
            Taking down hides this flyer from residents immediately.
          </p>
          <div className="flex items-center gap-2">
            {/* Mobile parity: the live decision bar's secondary "View on map" */}
            <Button
              asChild
              disabled={rejectFlyer.isPending}
              type="button"
              variant="outline"
            >
              <Link href={discoveryMapHref(flyer.id)}>
                <MapIcon />
                View on map
              </Link>
            </Button>
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
