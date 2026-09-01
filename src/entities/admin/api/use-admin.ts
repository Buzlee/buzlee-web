// PORTED FROM buzlee-app/src/entities/admin/api/use-admin.ts — keep in sync; see docs/admin-sync.md
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateBusiness } from "@/entities/business/api/business-queries";
import { businessKeys } from "@/entities/business/api/use-business";
import type { BusinessUpdate } from "@/entities/business/model/types";
import { flyerKeys } from "@/entities/flyer/api/use-flyer";
import { useAuth } from "@/entities/session";
import { sendBusinessClaimInvite } from "../lib/send-business-claim-invite";
import type {
  AdminBusinessFilters,
  AdminDeletableEntity,
  AdminFlyerFilters,
} from "../model/types";
import * as queries from "./admin-queries";

/**
 * Query key factory for admin queries
 * Hierarchical structure allows selective invalidation
 */
export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  statusCounts: () => [...adminKeys.all, "status-counts"] as const,
  businesses: () => [...adminKeys.all, "businesses"] as const,
  businessList: (filters: string) =>
    [...adminKeys.businesses(), filters] as const,
  businessDetail: (id: string) =>
    [...adminKeys.businesses(), "detail", id] as const,
  deletedBusinesses: () => [...adminKeys.businesses(), "deleted"] as const,
  flyers: () => [...adminKeys.all, "flyers"] as const,
  flyerList: (filters: string) => [...adminKeys.flyers(), filters] as const,
  flyerDetail: (id: string) => [...adminKeys.flyers(), "detail", id] as const,
  residents: () => [...adminKeys.all, "residents"] as const,
};

/**
 * Fetch admin dashboard statistics
 */
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: queries.fetchAdminDashboardStats,
  });
}

/**
 * Full per-status counts for businesses and flyers (Inbox hero + filter chips).
 */
export function useAdminStatusCounts() {
  return useQuery({
    queryKey: adminKeys.statusCounts(),
    queryFn: queries.fetchAdminStatusCounts,
  });
}

/**
 * Fetch a single flyer for the admin flyer-review screen.
 */
export function useAdminFlyer(flyerId: string) {
  return useQuery({
    queryKey: adminKeys.flyerDetail(flyerId),
    queryFn: () => queries.fetchAdminFlyer(flyerId),
    enabled: !!flyerId,
  });
}

/**
 * Fetch single business for admin (efficient for detail views)
 */
export function useAdminBusiness(businessId: string) {
  return useQuery({
    queryKey: adminKeys.businessDetail(businessId),
    queryFn: () => queries.fetchAdminBusiness(businessId),
    enabled: !!businessId,
  });
}

/**
 * Fetch businesses for admin with filters
 */
export function useAdminBusinesses(
  filters?: AdminBusinessFilters,
  options?: { enabled?: boolean },
) {
  const filtersKey = JSON.stringify(filters ?? {});

  return useQuery({
    queryKey: adminKeys.businessList(filtersKey),
    queryFn: () => queries.fetchAdminBusinesses(filters),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch soft-deleted businesses awaiting purge (admin "Deleted" segment)
 */
export function useAdminDeletedBusinesses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminKeys.deletedBusinesses(),
    queryFn: queries.fetchAdminDeletedBusinesses,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch flyers for admin with filters
 */
export function useAdminFlyers(filters?: AdminFlyerFilters) {
  const filtersKey = JSON.stringify(filters ?? {});

  return useQuery({
    queryKey: adminKeys.flyerList(filtersKey),
    queryFn: () => queries.fetchAdminFlyers(filters),
  });
}

/**
 * Fetch all residents for the admin directory
 */
export function useAdminResidents() {
  return useQuery({
    queryKey: adminKeys.residents(),
    queryFn: queries.fetchAdminResidents,
  });
}

/**
 * Admin: Create an unclaimed business listing
 */
export function useAdminCreateBusiness() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (input: queries.CreateUnclaimedBusinessInput) =>
      queries.createUnclaimedBusiness(input, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
  });
}

/**
 * Admin: Update any business's details (claimed or unclaimed).
 * Invalidates admin and business caches so both views reflect the change.
 */
export function useAdminUpdateBusiness(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: BusinessUpdate) =>
      updateBusiness(businessId, updates),
    onSuccess: (updatedBusiness) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.businessDetail(businessId),
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(businessId),
      });
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.myBusiness(updatedBusiness.user_id ?? ""),
      });
    },
  });
}

/**
 * Admin: Send a "claim your business" invitation email for an unclaimed listing.
 */
export function useSendBusinessClaimInvite() {
  return useMutation({
    mutationFn: (businessId: string) => sendBusinessClaimInvite(businessId),
  });
}

/**
 * Admin: Approve business
 * Invalidates all relevant queries including the business user's myBusiness query
 */
export function useAdminApproveBusiness() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (businessId: string) =>
      queries.approveBusiness(businessId, userId!),
    onSuccess: (updatedBusiness) => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });

      // Invalidate business queries (for consistency across entities)
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });

      // Invalidate the business user's myBusiness query so they see updated status immediately
      queryClient.invalidateQueries({
        queryKey: businessKeys.myBusiness(updatedBusiness.user_id ?? ""),
      });

      // Invalidate specific business detail query if they're viewing it
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(updatedBusiness.id),
      });
    },
  });
}

/**
 * Admin: Reject business
 * Invalidates all relevant queries including the business user's myBusiness query
 */
export function useAdminRejectBusiness() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: ({
      businessId,
      reason,
    }: {
      businessId: string;
      reason: string;
    }) => queries.rejectBusiness(businessId, userId!, reason),
    onSuccess: (updatedBusiness) => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });

      // Invalidate business queries (for consistency across entities)
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });

      // Invalidate the business user's myBusiness query so they see updated status immediately
      queryClient.invalidateQueries({
        queryKey: businessKeys.myBusiness(updatedBusiness.user_id ?? ""),
      });

      // Invalidate specific business detail query if they're viewing it
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(updatedBusiness.id),
      });
    },
  });
}

export type AdminDeleteMode = "soft" | "hard";

/**
 * Admin: Delete a business, resident, or flyer.
 * 'soft' hides it immediately and keeps data for 15 days (server purge);
 * 'hard' erases it right away with no recovery. Deletes can span entities
 * (a business delete takes its flyers along), so all related caches are
 * invalidated broadly — deletes are rare, so the extra refetches are cheap.
 */
export function useAdminDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entity,
      entityId,
      mode,
    }: {
      entity: AdminDeletableEntity;
      entityId: string;
      mode: AdminDeleteMode;
    }) =>
      mode === "hard"
        ? queries.hardDeleteEntity(entity, entityId)
        : queries.softDeleteEntity(entity, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      queryClient.invalidateQueries({ queryKey: flyerKeys.all });
    },
  });
}

/**
 * Admin: Restore a soft-deleted entity before the purge runs.
 * Same broad invalidation as delete — the row reappears across surfaces.
 */
export function useAdminRestoreEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entity,
      entityId,
    }: {
      entity: AdminDeletableEntity;
      entityId: string;
    }) => queries.restoreEntity(entity, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      queryClient.invalidateQueries({ queryKey: flyerKeys.all });
    },
  });
}

/**
 * Admin: Take a live flyer down (moderation). Sets it to rejected with a
 * reason the business sees. Invalidates admin lists, flyer lists, live
 * flyers, and stats.
 */
export function useAdminRejectFlyer() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: ({ flyerId, reason }: { flyerId: string; reason: string }) =>
      queries.rejectFlyer(flyerId, userId!, reason),
    onSuccess: () => {
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: adminKeys.flyers() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      queryClient.invalidateQueries({ queryKey: adminKeys.statusCounts() });
      // Invalidate flyer queries so the flyer disappears from resident-facing lists
      queryClient.invalidateQueries({ queryKey: flyerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flyerKeys.live() });
    },
  });
}
