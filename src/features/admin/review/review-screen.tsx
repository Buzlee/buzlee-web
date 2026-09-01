"use client";

import {
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminBusinessSummary } from "@/entities/admin";
import {
  claimDomainMatch,
  REJECT_REASONS,
  useAdminApproveBusiness,
  useAdminBusiness,
  useAdminBusinesses,
  useAdminRejectBusiness,
  useSendBusinessClaimInvite,
} from "@/entities/admin";
import { useBusinessClaims } from "@/entities/business-claim";
import { DomainPill } from "@/features/admin/components/domain-pill";
import { EmptyState } from "@/features/admin/components/empty-state";
import { InitialsAvatar } from "@/features/admin/components/initials-avatar";
import { TableSkeleton } from "@/features/admin/components/table-skeleton";
import { DeleteDialog } from "@/features/admin/dialogs/delete-dialog";
import { RejectDialog } from "@/features/admin/dialogs/reject-dialog";
import { formatRelativeTime, ownerLabel } from "@/features/admin/lib/format";
import { useReviewShortcuts } from "@/features/admin/review/use-review-shortcuts";
import { PageHeader } from "@/features/admin/shell/page-header";
import { StatusChip } from "@/features/admin/shell/status-chip";
import { cn } from "@/lib/utils";

function reviewUrl(id: string | null): string {
  return id ? `/admin/businesses/review?id=${id}` : "/admin/businesses/review";
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px] font-semibold text-secondary-foreground">
      {children}
    </kbd>
  );
}

function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border py-3 last:border-b-0">
      <span className="w-[110px] shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 flex-1 text-sm break-words text-foreground">
        {value ?? "—"}
      </span>
    </div>
  );
}

function PendingListItem({
  business,
  selected,
  onSelect,
}: {
  business: AdminBusinessSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-secondary"
          : "border-transparent hover:bg-secondary/60",
      )}
      onClick={onSelect}
      type="button"
    >
      <InitialsAvatar
        imageUrl={business.logo_url}
        name={business.name}
        size={32}
      />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm text-foreground",
            selected ? "font-semibold" : "font-medium",
          )}
        >
          {business.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {[business.category_name, business.town_name]
            .filter(Boolean)
            .join(" · ") || "—"}
        </span>
      </span>
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {formatRelativeTime(business.created_at)}
      </span>
    </button>
  );
}

export function ReviewScreen() {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");
  const [selectedId, setSelectedId] = useState<string | null>(urlId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: pendingBusinesses } = useAdminBusinesses({
    status: "pending",
  });
  const pendingList = pendingBusinesses
    ? [...pendingBusinesses].sort((a, b) =>
        a.created_at.localeCompare(b.created_at),
      )
    : undefined;

  const { data: business } = useAdminBusiness(selectedId ?? "");
  const { data: pendingClaims } = useBusinessClaims("pending");
  const claim = selectedId
    ? (pendingClaims?.find((c) => c.business_id === selectedId) ?? null)
    : null;

  const approveBusiness = useAdminApproveBusiness();
  const rejectBusiness = useAdminRejectBusiness();
  const sendClaimInvite = useSendBusinessClaimInvite();

  // Follow browser navigation (back/forward) into local state.
  useEffect(() => {
    setSelectedId(urlId);
  }, [urlId]);

  // No id in the URL: select the oldest pending business.
  useEffect(() => {
    if (selectedId || !pendingList || pendingList.length === 0) return;
    const first = pendingList[0];
    setSelectedId(first.id);
    window.history.replaceState(null, "", reviewUrl(first.id));
  }, [selectedId, pendingList]);

  function select(id: string | null) {
    setSelectedId(id);
    window.history.replaceState(null, "", reviewUrl(id));
  }

  function advanceAfterDecision(decidedId: string) {
    const list = pendingList ?? [];
    const index = list.findIndex((b) => b.id === decidedId);
    const next = list[index + 1] ?? list[index - 1] ?? null;
    select(next && next.id !== decidedId ? next.id : null);
  }

  function handleApprove() {
    if (!business || approveBusiness.isPending) return;
    const decidedId = business.id;
    approveBusiness.mutate(decidedId, {
      onSuccess: () => {
        toast.success(`Approved ${business.name}`);
        advanceAfterDecision(decidedId);
      },
      onError: (error) => toast.error(`Approve failed: ${error.message}`),
    });
  }

  function handleReject(reason: string) {
    if (!business || rejectBusiness.isPending) return;
    const decidedId = business.id;
    rejectBusiness.mutate(
      { businessId: decidedId, reason },
      {
        onSuccess: () => {
          toast.success(`Rejected ${business.name}`);
          setRejectOpen(false);
          advanceAfterDecision(decidedId);
        },
        onError: (error) => toast.error(`Reject failed: ${error.message}`),
      },
    );
  }

  function moveSelection(delta: number) {
    const list = pendingList ?? [];
    if (list.length === 0) return;
    const index = list.findIndex((b) => b.id === selectedId);
    const nextIndex =
      index === -1 ? 0 : Math.min(list.length - 1, Math.max(0, index + delta));
    const next = list[nextIndex];
    if (next && next.id !== selectedId) select(next.id);
  }

  useReviewShortcuts(Boolean(pendingList?.length), {
    onPrev: () => moveSelection(-1),
    onNext: () => moveSelection(1),
    onApprove: () => {
      if (business?.status === "pending") handleApprove();
    },
    onReject: () => {
      if (business?.status === "pending") setRejectOpen(true);
    },
  });

  function handleSendClaimInvite() {
    if (!business || sendClaimInvite.isPending) return;
    sendClaimInvite.mutate(business.id, {
      onSuccess: () => toast.success(`Claim invite sent to ${business.email}`),
      onError: (error) => toast.error(`Invite failed: ${error.message}`),
    });
  }

  const position = selectedId
    ? (pendingList?.findIndex((b) => b.id === selectedId) ?? -1)
    : -1;

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        actions={
          <>
            <span className="hidden items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground xl:flex">
              <Kbd>↑↓</Kbd> Navigate · <Kbd>A</Kbd> Approve · <Kbd>R</Kbd>{" "}
              Reject
            </span>
            {position >= 0 && pendingList ? (
              <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                {position + 1} of {pendingList.length}
              </span>
            ) : null}
            {business ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="Business actions"
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>Edit details</DropdownMenuItem>
                  {!business.user_id && business.email ? (
                    <DropdownMenuItem
                      disabled={sendClaimInvite.isPending}
                      onSelect={handleSendClaimInvite}
                    >
                      Send claim invite
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onSelect={() => setDeleteOpen(true)}
                    variant="destructive"
                  >
                    Delete business…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
        title={
          <span className="flex items-center gap-2 truncate">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/admin/businesses"
            >
              Businesses
            </Link>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Pending</span>
            {business ? (
              <>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{business.name}</span>
              </>
            ) : null}
          </span>
        }
      />

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[360px] shrink-0 flex-col border-r border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Pending · Oldest first
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!pendingList ? (
              <TableSkeleton avatar rows={6} />
            ) : pendingList.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                iconClassName="bg-[hsl(var(--action-checked-in-soft))] text-[hsl(var(--action-checked-in))]"
                title="You're all caught up"
              />
            ) : (
              <ul className="divide-y divide-border">
                {(pendingList ?? []).map((item) => (
                  <li key={item.id}>
                    <PendingListItem
                      business={item}
                      onSelect={() => select(item.id)}
                      selected={item.id === selectedId}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!selectedId || !business ? (
            <div className="flex flex-1 items-center justify-center">
              {pendingList && pendingList.length === 0 && !selectedId ? (
                <EmptyState
                  caption="New submissions will appear in the pending list."
                  icon={CheckCircle2}
                  iconClassName="bg-[hsl(var(--action-checked-in-soft))] text-[hsl(var(--action-checked-in))]"
                  title="No businesses waiting for review"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <div className="flex items-center gap-4">
                  <InitialsAvatar
                    imageUrl={business.logo_url}
                    name={business.name}
                    size={64}
                    rounded="rounded-xl"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h1 className="truncate text-[26px] font-bold tracking-tight text-foreground">
                        {business.name}
                      </h1>
                      <StatusChip variant={business.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Submitted {formatRelativeTime(business.created_at)} ·{" "}
                      {ownerLabel(business.user_id).toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-8">
                  <div className="min-w-64 flex-1">
                    <FactRow
                      label="Category"
                      value={business.category_name ?? "—"}
                    />
                    <FactRow label="Address" value={business.address ?? "—"} />
                    <FactRow label="Email" value={business.email ?? "—"} />
                    <FactRow label="Phone" value={business.phone ?? "—"} />
                    <FactRow
                      label="Website"
                      value={
                        business.website ? (
                          <a
                            className="text-accent-foreground underline-offset-2 hover:underline"
                            href={business.website}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {business.website}
                          </a>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <FactRow label="Town" value={business.town_name ?? "—"} />
                    {business.description ? (
                      <FactRow label="About" value={business.description} />
                    ) : null}
                  </div>

                  <div className="flex w-80 shrink-0 flex-col gap-4">
                    {business.cover_photo_url ? (
                      // biome-ignore lint/performance/noImgElement: remote storage asset; plain img avoids loader failures
                      <img
                        alt={`${business.name} cover`}
                        className="h-[180px] w-[320px] rounded-lg border border-border object-cover"
                        height={180}
                        src={business.cover_photo_url}
                        width={320}
                      />
                    ) : (
                      <div className="flex h-[180px] w-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/50">
                        <ImageIcon className="size-6 text-muted-foreground" />
                      </div>
                    )}

                    {claim ? (
                      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                          Pending claim
                        </h3>
                        <div className="mt-3 flex items-center gap-3">
                          <InitialsAvatar
                            name={claim.contact_name ?? claim.contact_email}
                            rounded="rounded-full"
                            size={32}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {claim.contact_name ??
                                claim.contact_email ??
                                "Unknown claimant"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {claim.contact_email ?? "no email"}
                            </p>
                          </div>
                          <DomainPill
                            status={
                              claimDomainMatch({
                                claimEmail: claim.contact_email,
                                businessEmail: business.email,
                                businessWebsite: business.website,
                              }).status
                            }
                          />
                        </div>
                        {claim.message ? (
                          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                            “{claim.message}”
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {business.status === "pending" ? (
                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-background px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    Approving publishes this listing to residents immediately.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={rejectBusiness.isPending}
                      onClick={() => setRejectOpen(true)}
                      type="button"
                      variant="outline"
                    >
                      Reject…
                    </Button>
                    <Button
                      className="bg-foreground text-background hover:bg-foreground/90"
                      disabled={approveBusiness.isPending}
                      onClick={handleApprove}
                      type="button"
                    >
                      {approveBusiness.isPending
                        ? "Approving…"
                        : "Approve listing"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      {business ? (
        <DeleteDialog
          entity="business"
          entityId={business.id}
          name={business.name}
          onDeleted={() => advanceAfterDecision(business.id)}
          onOpenChange={setDeleteOpen}
          open={deleteOpen}
        />
      ) : null}
      <RejectDialog
        ctaLabel="Reject & notify owner"
        onConfirm={handleReject}
        onOpenChange={setRejectOpen}
        open={rejectOpen}
        pending={rejectBusiness.isPending}
        reasons={REJECT_REASONS}
        title={business ? `Reject ${business.name}?` : "Reject listing?"}
      />
    </div>
  );
}
