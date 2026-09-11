// PORTED FROM buzlee-app/src/features/admin-inbox/model/triage-queue.ts — keep in sync; see docs/admin-sync.md
/**
 * Pure triage-queue logic for the admin Inbox "Next up" card
 * (Screens - Admin v2 · § F Next up — skip & triage flow).
 *
 * Both review queues (pending businesses, pending claims) are merged into one
 * list, oldest first. Skipping an item is "not now": it moves to the end of the
 * current pass but never leaves the list, and it comes back once everything
 * ahead of it has been decided. Nothing here touches the database.
 */
import type { AdminBusinessSummary } from "@/entities/admin";
import type { BusinessClaimWithBusiness } from "@/entities/business-claim";

export type TriageKind = "business" | "claim";

export type TriageItem = {
  /** Stable id — business id or claim id. Used for skip bookkeeping. */
  id: string;
  kind: TriageKind;
  title: string;
  /** Second line under the title, e.g. "Business approval · Verona". */
  meta: string;
  initials: string;
  imageUrl: string | null;
  createdAt: string;
  /** Detail route the "Review now" button pushes. */
  href: string;
};

export type TriageState = {
  /** Every undecided item, oldest first, in original (unskipped) order. */
  queue: TriageItem[];
  /** The item to review now, or null when the queue is empty. */
  nextUp: TriageItem | null;
  /** The item after `nextUp` in this pass, or null. */
  then: TriageItem | null;
  /** Undecided count, skipped included. Drops only on approve/reject. */
  left: number;
  /** How many of the undecided items were skipped in this pass. */
  skippedCount: number;
  /** True when `nextUp` was skipped earlier and has come back around. */
  isBackAround: boolean;
  /** Skip is only offered when there is somewhere else to go. */
  canSkip: boolean;
};

export function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function businessTriageItem(business: AdminBusinessSummary): TriageItem {
  return {
    id: business.id,
    kind: "business",
    title: business.name,
    meta: ["Business approval", business.town_name].filter(Boolean).join(" · "),
    initials: initialsFor(business.name),
    imageUrl: business.logo_url ?? null,
    createdAt: business.created_at,
    // Web fix: web route (app: `/(admin-detail)/business-review/${id}`).
    href: `/admin/businesses/review?id=${business.id}`,
  };
}

export function claimTriageItem(claim: BusinessClaimWithBusiness): TriageItem {
  // Web fix: fall back to the contact email before "Unknown claimant", like
  // every other claim surface on the web.
  const claimant =
    claim.contact_name || claim.contact_email || "Unknown claimant";
  return {
    id: claim.id,
    kind: "claim",
    title: claimant,
    meta: ["Claim request", claim.business?.name].filter(Boolean).join(" · "),
    initials: initialsFor(claimant),
    imageUrl: null,
    createdAt: claim.created_at,
    // Web fix: web route (app: `/(admin-detail)/claim-review/${id}`).
    href: `/admin/claims?id=${claim.id}`,
  };
}

/** Merge both queues into one list, oldest first. Ties keep businesses first. */
export function buildTriageQueue(
  businesses: readonly AdminBusinessSummary[] | undefined,
  claims: readonly BusinessClaimWithBusiness[] | undefined,
): TriageItem[] {
  const items = [
    ...(businesses ?? []).map(businessTriageItem),
    ...(claims ?? []).map(claimTriageItem),
  ];
  return items.sort((a, b) => {
    const diff =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (diff !== 0) return diff;
    if (a.kind !== b.kind) return a.kind === "business" ? -1 : 1;
    return 0;
  });
}

/**
 * Order the current pass: unskipped items oldest first, then skipped items in
 * the order they were skipped. Skipped ids that are no longer pending are
 * ignored (they were decided elsewhere).
 */
export function orderPass(
  queue: readonly TriageItem[],
  skippedIds: readonly string[],
): TriageItem[] {
  const skipped = new Set(skippedIds);
  const fresh = queue.filter((item) => !skipped.has(item.id));
  const byId = new Map(queue.map((item) => [item.id, item] as const));
  const returning = skippedIds
    .map((id) => byId.get(id))
    .filter((item): item is TriageItem => item != null);
  return [...fresh, ...returning];
}

export function resolveTriage(
  queue: readonly TriageItem[],
  skippedIds: readonly string[],
): TriageState {
  const pass = orderPass(queue, skippedIds);
  const skipped = new Set(skippedIds);
  const nextUp = pass[0] ?? null;
  const skippedCount = queue.filter((item) => skipped.has(item.id)).length;

  return {
    queue: [...queue],
    nextUp,
    // biome-ignore lint/suspicious/noThenProperty: app's field name (the item after nextUp); this object is never awaited
    then: pass[1] ?? null,
    left: queue.length,
    skippedCount,
    isBackAround: nextUp != null && skipped.has(nextUp.id),
    canSkip: pass.length > 1,
  };
}

/** Copy for the quiet line under the card. */
export function remainingCopy(state: TriageState): string {
  const others = state.left - 1;
  if (state.nextUp == null) return "";
  if (others <= 0) {
    return state.isBackAround
      ? "Last one. You skipped it earlier and nothing else is waiting."
      : "Last one waiting.";
  }
  const head = `${others} more after this`;
  if (state.skippedCount === 0) return head;
  if (state.isBackAround) return `${head} · skipped earlier, back around`;
  return `${head} · ${state.skippedCount} skipped, back at the end`;
}

/** Eyebrow label for the card. */
export function eyebrowCopy(state: TriageState): string {
  if (state.isBackAround) return "Next up · Back around";
  if (state.skippedCount > 0) return `Next up · ${state.skippedCount} skipped`;
  return "Next up · Oldest first";
}
