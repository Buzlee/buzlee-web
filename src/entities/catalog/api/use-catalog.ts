// PORTED FROM buzlee-app/src/entities/catalog/api/use-catalog.ts — keep in sync; see docs/admin-sync.md
import { useQuery } from "@tanstack/react-query";
import * as queries from "./catalog-queries";

export const catalogKeys = {
  all: ["catalog"] as const,
  businessCategories: () =>
    [...catalogKeys.all, "business-categories"] as const,
  flyerCategories: () => [...catalogKeys.all, "flyer-categories"] as const,
  flyerCategory: (id: string) =>
    [...catalogKeys.flyerCategories(), id] as const,
  towns: () => [...catalogKeys.all, "towns"] as const,
  town: (id: string) => [...catalogKeys.towns(), id] as const,
  tags: () => [...catalogKeys.all, "tags"] as const,
};

/**
 * Fetch all active business categories
 */
export function useBusinessCategories() {
  return useQuery({
    queryKey: catalogKeys.businessCategories(),
    queryFn: queries.fetchBusinessCategories,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Fetch all active flyer categories
 */
export function useFlyerCategories() {
  return useQuery({
    queryKey: catalogKeys.flyerCategories(),
    queryFn: queries.fetchFlyerCategories,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Fetch single flyer category by ID
 */
export function useFlyerCategory(id: string) {
  return useQuery({
    queryKey: catalogKeys.flyerCategory(id),
    queryFn: () => queries.fetchFlyerCategory(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Fetch all towns
 */
export function useTowns() {
  return useQuery({
    queryKey: catalogKeys.towns(),
    queryFn: queries.fetchTowns,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Fetch single town by ID
 */
export function useTown(id: string) {
  return useQuery({
    queryKey: catalogKeys.town(id),
    queryFn: () => queries.fetchTown(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * Fetch all tags
 */
export function useTags() {
  return useQuery({
    queryKey: catalogKeys.tags(),
    queryFn: queries.fetchTags,
    staleTime: 1000 * 60 * 30,
  });
}
