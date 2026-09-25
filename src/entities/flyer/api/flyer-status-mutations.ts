// PORTED FROM buzlee-app/src/entities/flyer/api/flyer-status-mutations.ts — keep in sync; see docs/admin-sync.md
// Web fix: the app invalidates through a module-level `queryClient`; the web
// has none, so each mutation takes the caller's QueryClient. Analytics
// (`captureFlyer*`) is not ported. `archiveFlyer` is not used by the admin.

/**
 * Flyer status transitions (publish / unpublish / delete).
 *
 * Pure async functions — no React, no UI. Each one performs the DB write,
 * fires the matching side effects (member notify) and invalidates the React
 * Query caches, so any caller gets identical behaviour.
 *
 * `expires_at` is derived by the DB trigger `flyers_sync_expires_at_on_status`
 * whenever `status` changes, so these writes only ever send `status` (+ `live_at`).
 */
import type { QueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/entities/admin/api/use-admin";
import { getFlyerCurrentOrNextOccurrenceWindow } from "../lib/flyer-helper";
import {
  invokeMemberFlyerNotify,
  toMemberFlyerNotifyRecord,
} from "../lib/send-member-flyer-notification";
import type { Flyer, FlyerWithDetails } from "../model/types";
import * as queries from "./flyer-queries";
import { flyerKeys } from "./use-flyer";

export type PublishFlyerResult =
  | { ok: true; flyer: Flyer }
  | { ok: false; reason: "past_event" };

/**
 * Event-aware "has the flyer's schedule already passed?" check.
 * Uses the last occurrence across all of the flyer's events; an unbounded
 * recurring event never passes.
 */
export function isFlyerEventPast(
  flyer: FlyerWithDetails,
  reference: Date = new Date(),
): boolean {
  return (
    getFlyerCurrentOrNextOccurrenceWindow(flyer, reference).end < reference
  );
}

/**
 * Invalidate every cache that can show a flyer's status: the owner's list,
 * resident lists / live map, the detail view, business discovery and the
 * admin flyer views.
 */
function invalidateFlyerStatusQueries(
  queryClient: QueryClient,
  flyer: Pick<Flyer, "id" | "business_id">,
): void {
  queryClient.invalidateQueries({
    queryKey: flyerKeys.myFlyers(flyer.business_id),
  });
  queryClient.invalidateQueries({ queryKey: flyerKeys.lists() });
  queryClient.invalidateQueries({ queryKey: flyerKeys.live() });
  queryClient.invalidateQueries({ queryKey: flyerKeys.detail(flyer.id) });
  queryClient.invalidateQueries({
    queryKey: [...flyerKeys.all, "businessDiscovery"],
  });
  queryClient.invalidateQueries({ queryKey: adminKeys.flyers() });
  queryClient.invalidateQueries({
    queryKey: adminKeys.businessDetail(flyer.business_id),
  });
  queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
}

/**
 * Publish a flyer (status -> live). Refuses when the event has already passed.
 * Notifies business members.
 */
export async function publishFlyer(
  queryClient: QueryClient,
  flyer: FlyerWithDetails,
): Promise<PublishFlyerResult> {
  if (isFlyerEventPast(flyer)) {
    return { ok: false, reason: "past_event" };
  }

  const updated = await queries.updateFlyer(flyer.id, {
    status: "live",
    live_at: new Date().toISOString(),
  });

  await invokeMemberFlyerNotify({
    type: "UPDATE",
    table: "flyers",
    record: toMemberFlyerNotifyRecord(updated),
    old_record: toMemberFlyerNotifyRecord(flyer),
  });
  invalidateFlyerStatusQueries(queryClient, flyer);

  return { ok: true, flyer: updated };
}

/**
 * Move a flyer back to draft (status -> draft, live_at cleared).
 */
export async function unpublishFlyer(
  queryClient: QueryClient,
  flyer: FlyerWithDetails,
): Promise<Flyer> {
  const updated = await queries.updateFlyer(flyer.id, {
    status: "draft",
    live_at: null,
  });

  invalidateFlyerStatusQueries(queryClient, flyer);

  return updated;
}

/**
 * Delete a flyer (record + media). Invalidates every flyer query.
 */
export async function deleteFlyerAndTrack(
  queryClient: QueryClient,
  flyer: FlyerWithDetails,
): Promise<void> {
  await queries.deleteFlyer(flyer.id);

  queryClient.invalidateQueries({ queryKey: flyerKeys.all });
  queryClient.invalidateQueries({ queryKey: adminKeys.flyers() });
  queryClient.invalidateQueries({
    queryKey: adminKeys.businessDetail(flyer.business_id),
  });
  queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
}
