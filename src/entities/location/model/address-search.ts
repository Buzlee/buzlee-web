// PORTED FROM buzlee-app/src/entities/location/model/address-search.ts — keep in sync; see docs/admin-sync.md
/** Minimum query length before calling the geocoder (aligned with MapTiler client guard). */
export const ADDRESS_SEARCH_MIN_QUERY_LENGTH = 3;

/**
 * Debounce (ms) before a settled query is sent to the (paid) autocomplete API.
 * Each request costs a Geoapify credit, so this is deliberately longer than a
 * typical UI debounce to skip mid-word keystrokes; ~450ms is below the
 * threshold where typeahead feels laggy.
 */
export const ADDRESS_SEARCH_DEBOUNCE_MS = 450;

/** Upper bound on query length sent to the geocoder (abuse / junk-input guard). */
export const ADDRESS_SEARCH_MAX_QUERY_LENGTH = 100;

/**
 * Normalize a raw address query into a stable cache + request key.
 *
 * Lowercases, trims, and collapses internal whitespace so that "Main St",
 * "main st", and "Main  St " resolve to ONE cache entry / ONE paid request
 * instead of three. Geoapify autocomplete is case-insensitive and display text
 * comes from the (properly cased) result, so this is purely a credit saver.
 */
export function normalizeAddressQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}
