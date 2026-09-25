/**
 * Admin-side React Query hooks over the ported business-claim queries.
 * Web-only (buzlee-app's use-business-claim.ts is claimant-side and not
 * ported) — mirrors the query-key + invalidation style of use-admin.ts.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/entities/admin/api/use-admin";
import { businessKeys } from "@/entities/business/api/use-business";
import type { BusinessClaimStatus } from "../model/types";
import * as claimQueries from "./business-claim-queries";

/**
 * Query key factory for admin claim queries
 */
export const businessClaimKeys = {
  all: ["business-claims"] as const,
  lists: () => [...businessClaimKeys.all, "list"] as const,
  list: (status: string) => [...businessClaimKeys.lists(), status] as const,
};

/**
 * Admin: list claims (optionally by status) with joined business info.
 */
export function useBusinessClaims(status?: BusinessClaimStatus) {
  return useQuery({
    queryKey: businessClaimKeys.list(status ?? "all"),
    queryFn: () => claimQueries.fetchBusinessClaims(status),
  });
}

/**
 * Count of pending claims — drives the Inbox badge. Shares the pending
 * list's cache entry so the badge and the Inbox list stay consistent.
 */
export function usePendingClaimsCount() {
  return useQuery({
    queryKey: businessClaimKeys.list("pending"),
    queryFn: () => claimQueries.fetchBusinessClaims("pending"),
    select: (claims) => claims.length,
  });
}

/**
 * Admin: approve a claim (assigns ownership atomically via RPC).
 * The business gains an owner, so business/admin caches are invalidated too.
 */
export function useApproveBusinessClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (claimId: string) => claimQueries.approveBusinessClaim(claimId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessClaimKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Admin: reject a claim with a reason (via RPC).
 */
export function useRejectBusinessClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason: string }) =>
      claimQueries.rejectBusinessClaim(claimId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessClaimKeys.all });
    },
  });
}
