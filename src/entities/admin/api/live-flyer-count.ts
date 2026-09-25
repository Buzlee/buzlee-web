// Web-only (not in buzlee-app). See docs/admin-sync.md, "Live flyer count".
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { adminKeys } from "./use-admin";

/**
 * Number of flyers with status `live` — the same rows as the Flyers screen's
 * Live list (scheduled flyers with a future `live_at` are included; the
 * resident discovery query additionally requires `live_at <= now`).
 *
 * `count_flyers_by_status()` only groups pending / approved / rejected, so
 * `statusCounts.flyers.live` is always undefined and the dashboard showed
 * "0 live flyers" next to a map full of pins. A head-only count is cheap and
 * always agrees with the list. The `deleted_at` filter duplicates the
 * `flyers_hide_soft_deleted` RLS policy on purpose — the count must never
 * depend on which policies a session happens to get.
 */
export async function fetchAdminLiveFlyerCount(): Promise<number> {
  const { count, error } = await supabase
    .from("flyers")
    .select("id", { count: "exact", head: true })
    .eq("status", "live")
    .is("deleted_at", null);

  if (error) throw error;
  return count ?? 0;
}

/** Lives under `adminKeys.flyers()` so every flyer mutation's invalidation refreshes it. */
export function useAdminLiveFlyerCount() {
  return useQuery({
    queryKey: [...adminKeys.flyers(), "live-count"] as const,
    queryFn: fetchAdminLiveFlyerCount,
  });
}
