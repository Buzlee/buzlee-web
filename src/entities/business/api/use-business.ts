// PORTED FROM buzlee-app/src/entities/business/api/use-business.ts — keep in sync; see docs/admin-sync.md
// Web trim: only the query-key factory and `useBusiness` are ported. The
// other hooks in the buzlee-app original are owner/resident-side and
// RN-specific.
import { useQuery } from "@tanstack/react-query";
import * as queries from "./business-queries";

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

/**
 * Fetch single business by ID
 */
export function useBusiness(id: string) {
  return useQuery({
    queryKey: businessKeys.detail(id),
    queryFn: () => queries.fetchBusiness(id),
    enabled: !!id,
  });
}
