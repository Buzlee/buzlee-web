"use client";

import { FileText, MoreHorizontal, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminFlyerSummary } from "@/entities/admin";
import {
  FLYER_TAKEDOWN_REASONS,
  useAdminFlyers,
  useAdminRejectFlyer,
  useAdminStatusCounts,
} from "@/entities/admin";
import { EmptyState } from "@/features/admin/components/empty-state";
import {
  type FilterChipOption,
  FilterChips,
} from "@/features/admin/components/filter-chips";
import { SearchInput } from "@/features/admin/components/search-input";
import { RejectDialog } from "@/features/admin/dialogs/reject-dialog";
import {
  formatRelativeTime,
  formatShortDate,
} from "@/features/admin/lib/format";

type FlyerFilter = "live" | "last24h" | "takenDown" | "expired";

const DAY_MS = 24 * 60 * 60 * 1000;

function FlyerThumb({ flyer }: { flyer: AdminFlyerSummary }) {
  if (flyer.media_type === "image" && flyer.media_url) {
    return (
      // biome-ignore lint/performance/noImgElement: tiny table thumb; media may live outside the next/image allowlist
      <img
        alt=""
        className="size-12 shrink-0 rounded-md border border-border object-cover"
        height={48}
        src={flyer.media_url}
        width={48}
      />
    );
  }
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-secondary">
      <FileText className="size-5 text-muted-foreground" />
    </span>
  );
}

export function FlyersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FlyerFilter>("live");
  const [search, setSearch] = useState("");
  const [takedownTarget, setTakedownTarget] =
    useState<AdminFlyerSummary | null>(null);

  const { data: statusCounts } = useAdminStatusCounts();
  // Live list always loads: it backs the Live view, the Last 24h view, and
  // the Last 24h chip count.
  const { data: liveFlyers } = useAdminFlyers({ status: "live" });
  const { data: takenDownFlyers } = useAdminFlyers({ status: "rejected" });
  const { data: expiredFlyers } = useAdminFlyers({ status: "expired" });
  const rejectFlyer = useAdminRejectFlyer();

  const last24hFlyers = useMemo(() => {
    const cutoff = Date.now() - DAY_MS;
    return (liveFlyers ?? []).filter(
      (flyer) => new Date(flyer.created_at).getTime() >= cutoff,
    );
  }, [liveFlyers]);

  const chips: FilterChipOption<FlyerFilter>[] = [
    { value: "live", label: "Live", count: statusCounts?.flyers.live ?? 0 },
    { value: "last24h", label: "Last 24h", count: last24hFlyers.length },
    {
      value: "takenDown",
      label: "Taken down",
      count: statusCounts?.flyers.rejected ?? 0,
    },
    {
      value: "expired",
      label: "Expired",
      count: statusCounts?.flyers.expired ?? 0,
    },
  ];

  const source =
    filter === "live"
      ? liveFlyers
      : filter === "last24h"
        ? last24hFlyers
        : filter === "takenDown"
          ? takenDownFlyers
          : expiredFlyers;

  const rows = (source ?? []).filter((flyer) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [flyer.title, flyer.business_name, flyer.town_name].some((field) =>
      field?.toLowerCase().includes(q),
    );
  });

  function handleTakedown(reason: string) {
    const target = takedownTarget;
    if (!target || rejectFlyer.isPending) return;
    rejectFlyer.mutate(
      { flyerId: target.id, reason },
      {
        onSuccess: () => {
          toast.success(`Took down “${target.title}”`);
          setTakedownTarget(null);
        },
        onError: (error) => toast.error(`Take down failed: ${error.message}`),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips onChange={setFilter} options={chips} value={filter} />
        <SearchInput
          className="w-64"
          onChange={setSearch}
          placeholder="Search flyers"
          value={search}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {rows.length === 0 ? (
          <EmptyState
            caption={
              search
                ? "No flyers match your search."
                : "Nothing here right now."
            }
            icon={Newspaper}
            title="No flyers"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16" />
                <TableHead>Title</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Town</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((flyer) => (
                <TableRow key={flyer.id}>
                  <TableCell>
                    <FlyerThumb flyer={flyer} />
                  </TableCell>
                  <TableCell className="max-w-72">
                    <span className="block truncate font-semibold text-foreground">
                      {flyer.title}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {flyer.business_name ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatShortDate(flyer.event_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {flyer.town_name ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatRelativeTime(flyer.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Actions for ${flyer.title}`}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {flyer.status === "live" ? (
                          <DropdownMenuItem
                            onSelect={() => setTakedownTarget(flyer)}
                            variant="destructive"
                          >
                            Take down…
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onSelect={() =>
                            router.push(
                              `/admin/businesses/review?id=${flyer.business_id}`,
                            )
                          }
                        >
                          View business
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RejectDialog
        ctaLabel="Take down flyer"
        description="The flyer disappears for residents immediately; the business sees the reason."
        onConfirm={handleTakedown}
        onOpenChange={(open) => {
          if (!open) setTakedownTarget(null);
        }}
        open={takedownTarget !== null}
        pending={rejectFlyer.isPending}
        reasons={FLYER_TAKEDOWN_REASONS}
        title="Take down this flyer?"
      />
    </div>
  );
}
