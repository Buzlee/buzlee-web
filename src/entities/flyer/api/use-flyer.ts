// PORTED FROM buzlee-app/src/entities/flyer/api/use-flyer.ts — keep in sync; see docs/admin-sync.md
// Web trim: only the query-key factory is ported. The hooks in the
// buzlee-app original are resident/business-side and RN-specific.

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
