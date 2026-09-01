"use client";

import { Copy, Users } from "lucide-react";
import { useState } from "react";
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
import type { AdminResidentSummary } from "@/entities/admin";
import { useAdminResidents } from "@/entities/admin";
import { EmptyState } from "@/features/admin/components/empty-state";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { SearchInput } from "@/features/admin/components/search-input";
import { formatLongDate } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";

function residentName(resident: AdminResidentSummary): string {
  return (
    [resident.first_name, resident.last_name].filter(Boolean).join(" ") ||
    (resident.email ?? "Unnamed resident")
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-b-0">
      <span className="w-[110px] shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm break-words text-foreground">
        {value}
      </span>
    </div>
  );
}

export function ResidentsScreen() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: residents } = useAdminResidents();

  const rows = (residents ?? []).filter((resident) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [
      residentName(resident),
      resident.email,
      resident.contact_email,
      resident.town_name,
    ].some((field) => field?.toLowerCase().includes(q));
  });

  const selected = selectedId
    ? (residents?.find((resident) => resident.id === selectedId) ?? null)
    : null;

  function copyEmail(email: string | null) {
    if (!email) return;
    navigator.clipboard
      .writeText(email)
      .then(() => toast.success("Email copied"))
      .catch(() => toast.error("Could not copy email"));
  }

  return (
    <div className="flex min-h-0 flex-1 items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {residents
              ? `${residents.length} resident${residents.length === 1 ? "" : "s"}`
              : "Loading…"}
          </span>
          <SearchInput
            className="w-64"
            onChange={setSearch}
            placeholder="Search residents"
            value={search}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {rows.length === 0 ? (
            <EmptyState
              caption={
                search ? "No residents match your search." : "No residents yet."
              }
              icon={Users}
              title="No residents"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14" />
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Town</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((resident) => (
                  <TableRow
                    className={cn(
                      "cursor-pointer",
                      resident.id === selectedId && "bg-secondary",
                    )}
                    key={resident.id}
                    onClick={() =>
                      setSelectedId(
                        resident.id === selectedId ? null : resident.id,
                      )
                    }
                  >
                    <TableCell>
                      <InitialsAvatar
                        imageUrl={resident.avatar_url}
                        name={residentName(resident)}
                        rounded="rounded-full"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {residentName(resident)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {resident.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {resident.town_name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatLongDate(resident.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {selected ? (
        <aside className="sticky top-0 flex h-svh w-[400px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <InitialsAvatar
              imageUrl={selected.avatar_url}
              name={residentName(selected)}
              rounded="rounded-full"
              size={56}
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold tracking-tight text-foreground">
                {residentName(selected)}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {selected.town_name ?? "No town set"}
              </p>
            </div>
          </div>

          <div>
            <PanelRow label="Sign-in email" value={selected.email ?? "—"} />
            <PanelRow
              label="Contact email"
              value={selected.contact_email ?? "—"}
            />
            <PanelRow label="Town" value={selected.town_name ?? "—"} />
            <PanelRow
              label="Joined"
              value={formatLongDate(selected.created_at)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={!selected.email}
              onClick={() => copyEmail(selected.email)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Copy />
              Copy email
            </Button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
