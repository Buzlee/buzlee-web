// PORTED FROM buzlee-app/src/entities/flyer/api/use-flyer.ts — keep in sync; see docs/admin-sync.md
// Web trim: the query-key factory plus `useFlyer` / `useFlyerTags` (the flyer
// wizard's edit-mode reads) and `useFlyers` (admin map + feed). The remaining
// hooks in the buzlee-app original are resident/business-side and RN-specific.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FlyerFilters } from "../model/types";
import * as queries from "./flyer-queries";
import * as tagQueries from "./flyer-tag-queries";

/**
 * Query key factory for flyer queries
 * Hierarchical structure allows selective invalidation
 */
export const flyerKeys = {
  all: ["flyer"] as const,
  lists: () => [...flyerKeys.all, "list"] as const,
  list: (filters: string) => [...flyerKeys.lists(), filters] as const,
  live: () => [...flyerKeys.all, "live"] as const,
  details: () => [...flyerKeys.all, "detail"] as const,
  detail: (id: string) => [...flyerKeys.details(), id] as const,
  myFlyers: (businessId: string) =>
    [...flyerKeys.all, "my", businessId] as const,
  businessDiscovery: (businessId: string, filtersKey: string) =>
    [...flyerKeys.all, "businessDiscovery", businessId, filtersKey] as const,
  savedFlyers: (residentId: string) =>
    [...flyerKeys.all, "saved", residentId] as const,
  savedIds: (residentId: string) =>
    [...flyerKeys.all, "savedIds", residentId] as const,
  isSaved: (residentId: string, flyerId: string) =>
    [...flyerKeys.all, "isSaved", residentId, flyerId] as const,
  checkedInEvents: (residentId: string, flyerId: string) =>
    [...flyerKeys.all, "checkedInEvents", residentId, flyerId] as const,
  checkinCount: (residentId: string) =>
    [...flyerKeys.all, "checkinCount", residentId] as const,
  remindedEvents: (residentId: string, flyerId: string) =>
    [...flyerKeys.all, "remindedEvents", residentId, flyerId] as const,
  flyerTags: (flyerId: string) => [...flyerKeys.all, "tags", flyerId] as const,
};

/**
 * Fetch single flyer by ID
 */
export function useFlyer(id: string) {
  return useQuery({
    queryKey: flyerKeys.detail(id),
    queryFn: () => queries.fetchFlyer(id),
    enabled: !!id,
  });
}

/**
 * Fetch flyers with filters
 * Uses shorter staleTime for live queries to ensure residents see fresh data
 */
export function useFlyers(filters?: FlyerFilters) {
  const filtersKey = JSON.stringify(filters ?? {});

  return useQuery({
    queryKey: flyerKeys.list(filtersKey),
    queryFn: () => queries.fetchFlyers(filters),
    // Live flyer queries need fresher data (30 seconds) for resident views
    staleTime: filters?.isLive ? 1000 * 30 : undefined,
    // Keep previous data visible while new filter results load to prevent flickering
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch tags for a flyer
 */
export function useFlyerTags(flyerId: string) {
  return useQuery({
    queryKey: flyerKeys.flyerTags(flyerId),
    queryFn: () => tagQueries.fetchFlyerTags(flyerId),
    enabled: !!flyerId,
  });
}
