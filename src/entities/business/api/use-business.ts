// PORTED FROM buzlee-app/src/entities/business/api/use-business.ts — keep in sync; see docs/admin-sync.md
// Web trim: only the query-key factory is ported. The hooks in the
// buzlee-app original are owner/resident-side and RN-specific.

/**
 * Query key factory for business queries
 * Hierarchical structure allows selective invalidation
 */
export const businessKeys = {
  all: ["business"] as const,
  lists: () => [...businessKeys.all, "list"] as const,
  list: (filters: string) => [...businessKeys.lists(), filters] as const,
  details: () => [...businessKeys.all, "detail"] as const,
  detail: (id: string) => [...businessKeys.details(), id] as const,
  myBusiness: (userId: string) => [...businessKeys.all, "my", userId] as const,
};
