// PORTED FROM buzlee-app/src/entities/location/api/use-location.ts — keep in sync; see docs/admin-sync.md
/**
 * Location React Query Hooks
 *
 * Provides hooks for address autocomplete search with debouncing.
 */

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ADDRESS_SEARCH_DEBOUNCE_MS,
  ADDRESS_SEARCH_MIN_QUERY_LENGTH,
  normalizeAddressQuery,
} from "../model/address-search";
import type { AddressSuggestion } from "../model/types";
import * as geocodingService from "./geocoding-service";
import { isClientGeocodingError } from "./geocoding-service";

// Query key factory
export const locationKeys = {
  all: ["location"] as const,
  search: (query: string) => [...locationKeys.all, "search", query] as const,
};

/**
 * Custom hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for address autocomplete search
 *
 * Debounces a NORMALIZED query and fetches suggestions via the geocoding proxy.
 * The query is normalized (lowercase/trim/collapsed whitespace) before keying so
 * case/spacing variants of the same address share one cache entry and one paid
 * request. Only searches when the query has at least
 * ADDRESS_SEARCH_MIN_QUERY_LENGTH characters.
 */
export function useAddressSearch(query: string, enabled: boolean = true) {
  const normalizedQuery = normalizeAddressQuery(query);
  const debouncedQuery = useDebounce(
    normalizedQuery,
    ADDRESS_SEARCH_DEBOUNCE_MS,
  );

  const shouldSearch =
    enabled && debouncedQuery.length >= ADDRESS_SEARCH_MIN_QUERY_LENGTH;

  return useQuery<AddressSuggestion[], Error>({
    queryKey: locationKeys.search(debouncedQuery),
    queryFn: ({ signal }) =>
      geocodingService.searchAndTransformAddresses(debouncedQuery, signal),
    enabled: shouldSearch,
    // A given query string always maps to the same addresses (geocoding results
    // are effectively immutable), so never auto-refetch a cached result — that
    // would spend a credit for identical data. `gcTime` still evicts idle
    // entries from memory; a genuinely new search after eviction re-fetches.
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30, // Hold cached queries for 30 min within a session
    // Don't refetch the (ephemeral) suggestion list on network reconnect or app
    // focus — the user has moved on; a background refetch is a pure wasted credit.
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    // Retry once on transient (5xx/network) failures only. 4xx (bad input,
    // unauthorized, rate-limited) won't succeed on retry — don't waste a call.
    retry: (failureCount, error) => {
      if (isClientGeocodingError(error)) return false;
      return failureCount < 1;
    },
    retryDelay: 1000, // Wait 1 second before retry
  });
}
