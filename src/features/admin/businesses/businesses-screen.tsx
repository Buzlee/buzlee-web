"use client";

import { ChevronRight, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  daysUntilPurge,
  useAdminBusinesses,
  useAdminDeletedBusinesses,
  useAdminRestoreEntity,
  useAdminStatusCounts,
} from "@/entities/admin";
import { EmptyState } from "@/features/admin/components/empty-state";
import {
  type FilterChipOption,
  FilterChips,
} from "@/features/admin/components/filter-chips";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { SearchInput } from "@/features/admin/components/search-input";
import { TableSkeleton } from "@/features/admin/components/table-skeleton";
import { formatRelativeTime, ownerLabel } from "@/features/admin/lib/format";
import {
  StatusChip,
  type StatusChipVariant,
} from "@/features/admin/shell/status-chip";

type BusinessFilter = "pending" | "approved" | "rejected" | "deleted";

const STATUS_TO_CHIP: Record<
  "pending" | "approved" | "rejected",
  StatusChipVariant
> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

function matchesSearch(search: string, ...fields: (string | null)[]): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field?.toLowerCase().includes(q));
}

export function BusinessesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<BusinessFilter>("pending");
  const [search, setSearch] = useState("");

  const { data: statusCounts } = useAdminStatusCounts();
  const { data: businesses, isLoading: businessesLoading } = useAdminBusinesses(
    filter === "deleted" ? undefined : { status: filter },
    { enabled: filter !== "deleted" },
  );
  const { data: deleted, isLoading: deletedLoading } =
    useAdminDeletedBusinesses({
      enabled: filter === "deleted",
    });
  const restoreEntity = useAdminRestoreEntity();

  const chips: FilterChipOption<BusinessFilter>[] = [
    {
      value: "pending",
      label: "Pending",
      count: statusCounts?.businesses.pending ?? 0,
    },
    {
      value: "approved",
      label: "Approved",
      count: statusCounts?.businesses.approved ?? 0,
    },
    {
      value: "rejected",
      label: "Rejected",
      count: statusCounts?.businesses.rejected ?? 0,
    },
    { value: "deleted", label: "Deleted", count: deleted?.length },
  ];

  const rows = useMemo(() => {
    const list = (businesses ?? []).filter((b) =>
      matchesSearch(search, b.name, b.email, b.category_name, b.town_name),
    );
    // Pending reviews oldest-first; everything else newest-first (query default).
    return filter === "pending"
      ? [...list].sort((a, b) => a.created_at.localeCompare(b.created_at))
      : list;
  }, [businesses, filter, search]);

  const deletedRows = (deleted ?? []).filter((b) =>
    matchesSearch(search, b.name, b.email, b.category_name, b.town_name),
  );

  function handleRestore(businessId: string, name: string) {
    restoreEntity.mutate(
      { entity: "business", entityId: businessId },
      {
        onSuccess: () => toast.success(`Restored ${name}`),
        onError: (error) => toast.error(`Restore failed: ${error.message}`),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips onChange={setFilter} options={chips} value={filter} />
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium whitespace-nowrap text-muted-foreground">
            {filter === "pending" ? "Oldest first" : "Newest first"}
          </span>
          <SearchInput
            className="w-64"
            onChange={setSearch}
            placeholder="Search businesses"
            value={search}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {filter === "deleted" ? (
          deletedLoading ? (
            <TableSkeleton />
          ) : deletedRows.length === 0 ? (
            <EmptyState
              caption="Soft-deleted businesses wait here for 15 days before the purge."
              icon={Store}
              title="No deleted businesses"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14" />
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Town</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead>Purge</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedRows.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>
                      <InitialsAvatar
                        imageUrl={business.logo_url}
                        name={business.name}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {business.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {business.email ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {business.category_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {business.town_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(business.deleted_at)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-destructive">
                        Purges in {daysUntilPurge(business.deleted_at)}d
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={restoreEntity.isPending}
                        onClick={() =>
                          handleRestore(business.id, business.name)
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        ) : businessesLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            caption={
              search
                ? "No businesses match your search."
                : `No ${filter} businesses right now.`
            }
            icon={Store}
            title="Nothing here"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Town</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((business) => (
                <TableRow
                  className="cursor-pointer"
                  key={business.id}
                  onClick={() =>
                    router.push(`/admin/businesses/review?id=${business.id}`)
                  }
                >
                  <TableCell>
                    <InitialsAvatar
                      imageUrl={business.logo_url}
                      name={business.name}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {business.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {business.email ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {business.category_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {business.town_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ownerLabel(business.user_id)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatRelativeTime(business.created_at)}
                  </TableCell>
                  <TableCell>
                    <StatusChip variant={STATUS_TO_CHIP[business.status]} />
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
