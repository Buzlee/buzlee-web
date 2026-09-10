// PORTED FROM buzlee-app/src/entities/location/api/geocoding-service.ts — keep in sync; see docs/admin-sync.md
/**
 * Geoapify Geocoding Service
 *
 * Provides address autocomplete and geocoding using the Geoapify Address
 * Autocomplete API. Results are restricted to Westchester County via a request
 * rectangle filter plus an authoritative county-name gate (with a lat/lng
 * bounds fallback).
 *
 * The Geoapify API key is NOT shipped to the client. Requests are proxied
 * through the `geocode-autocomplete` Supabase Edge Function, which holds the key
 * server-side, hard-codes the Westchester scope + result limit, requires a valid
 * Buzlee session, and rate-limits per user. This is the primary defense against
 * key scraping / credit drain.
 *
 * Web deviation: the app builds the request with `fetch` + `Env`; here we go
 * through `supabase.functions.invoke`, which attaches the same apikey /
 * Authorization headers from the browser session. Behaviour is otherwise
 * identical, including the status-carrying GeocodingError.
 */

import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";
import {
  ADDRESS_SEARCH_MAX_QUERY_LENGTH,
  ADDRESS_SEARCH_MIN_QUERY_LENGTH,
} from "../model/address-search";
import type {
  AddressSuggestion,
  GeoapifyAutocompleteResponse,
  GeoapifyResult,
  GeocodedLocation,
} from "../model/types";

// Westchester County bounding box.
// The request-side rect filter + proximity bias now live in the geocode-autocomplete
// edge function (server-side, so the scope can't be widened by a caller). These
// parsed bounds remain for the client-side fallback gate below.
const WESTCHESTER_BOUNDS = {
  minLng: -74.1,
  minLat: 40.85,
  maxLng: -73.4,
  maxLat: 41.4,
};

// Authoritative county name returned by Geoapify for Westchester addresses
const WESTCHESTER_COUNTY = "Westchester County";

// Geocoding proxy edge function (holds the Geoapify key server-side).
const GEOCODE_PROXY_FUNCTION = "geocode-autocomplete";

/**
 * Error thrown by the geocoding proxy, carrying the HTTP status so callers can
 * distinguish retryable transient failures (5xx / network) from terminal client
 * errors (4xx: bad input, unauthorized, rate-limited).
 */
export class GeocodingError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeocodingError";
    this.status = status;
  }
}

/** True for 4xx errors — never worth retrying (won't succeed, wastes a call). */
export function isClientGeocodingError(error: unknown): boolean {
  return (
    error instanceof GeocodingError &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  );
}

/**
 * Check if coordinates are within Westchester County bounds.
 * Used as a fallback when a result lacks a `county` field.
 */
export function isWithinWestchesterBounds(lat: number, lng: number): boolean {
  return (
    lat >= WESTCHESTER_BOUNDS.minLat &&
    lat <= WESTCHESTER_BOUNDS.maxLat &&
    lng >= WESTCHESTER_BOUNDS.minLng &&
    lng <= WESTCHESTER_BOUNDS.maxLng
  );
}

/**
 * Authoritative Westchester gate.
 *
 * Prefers the exact `county` name (independent of any town list). Falls back to
 * the lat/lng bounds check only when `county` is absent on the result.
 */
export function isWestchesterResult(result: GeoapifyResult): boolean {
  if (result.county) {
    return result.county === WESTCHESTER_COUNTY;
  }
  return isWithinWestchesterBounds(result.lat, result.lon);
}

/**
 * Search for addresses via the geocoding proxy edge function.
 *
 * The proxy applies the Westchester rect/bias and result limit server-side, so
 * the client only sends the query text. Requires an authenticated session;
 * returns [] when the user is signed out (the search UI lives behind auth).
 */
export async function searchAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<GeoapifyResult[]> {
  const text = query.trim();
  if (text.length < ADDRESS_SEARCH_MIN_QUERY_LENGTH) {
    return [];
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    // No session → can't call the proxy. The address search is only reachable
    // from authenticated flows, so treat this as "no results" rather than error.
    return [];
  }

  const { data, error } =
    await supabase.functions.invoke<GeoapifyAutocompleteResponse>(
      GEOCODE_PROXY_FUNCTION,
      {
        body: { text: text.slice(0, ADDRESS_SEARCH_MAX_QUERY_LENGTH) },
        signal,
      },
    );

  if (error) {
    const status =
      error instanceof FunctionsHttpError ? error.context?.status : undefined;
    throw new GeocodingError(
      `Geocoding request failed: ${status ?? ""} ${error.message}`.trim(),
      status,
    );
  }

  return data?.results || [];
}

// Geoapify prefixes localities with their municipality type
// (e.g. "City of White Plains", "Village of Pleasantville"). Our `towns` table
// stores bare names ("White Plains"), and the DB trigger matches town_name with
// an exact/prefix comparison — so strip the prefix to preserve town matching and
// keep display identical to the previous provider.
const MUNICIPALITY_PREFIX = /^(?:city|town|village|hamlet|borough)\s+of\s+/i;

function stripMunicipalityPrefix(name: string): string {
  return name.replace(MUNICIPALITY_PREFIX, "").trim();
}

/**
 * Derive the town/locality name for a result (city, falling back to county),
 * normalized to the bare town name used across the app.
 */
function townFromResult(result: GeoapifyResult): string | undefined {
  const raw = result.city ?? result.county ?? undefined;
  return raw ? stripMunicipalityPrefix(raw) : undefined;
}

/**
 * Geoapify appends the country to `formatted` (e.g. "…, United States of
 * America"); the previous provider did not. Trim it for display parity.
 */
function normalizeFormatted(formatted: string): string {
  return formatted
    .replace(/,\s*United States(?:\s+of\s+America)?\s*$/i, "")
    .trim();
}

/**
 * Build a street line from house number + street when available.
 */
function streetFromResult(result: GeoapifyResult): string | undefined {
  if (result.housenumber && result.street) {
    return `${result.housenumber} ${result.street}`;
  }
  return result.street ?? undefined;
}

/**
 * Transform a Geoapify result to the full GeocodedLocation shape.
 */
export function transformToGeocodedLocation(
  result: GeoapifyResult,
): GeocodedLocation {
  return {
    lat: result.lat,
    lng: result.lon,
    formatted_address: normalizeFormatted(result.formatted),
    town_name: townFromResult(result),
    street: streetFromResult(result),
    city: result.city ? stripMunicipalityPrefix(result.city) : undefined,
    state: result.state,
    postal_code: result.postcode,
    provider: "geoapify",
  };
}

/**
 * Transform a Geoapify result to an AddressSuggestion for UI display.
 */
export function transformToSuggestion(
  result: GeoapifyResult,
): AddressSuggestion {
  return {
    id: result.place_id,
    place_name: normalizeFormatted(result.formatted),
    lat: result.lat,
    lng: result.lon,
    town_name: townFromResult(result),
  };
}

/**
 * Map a UI suggestion row to the persisted GeocodedLocation shape (single source of truth).
 */
export function geocodedLocationFromSuggestion(
  suggestion: AddressSuggestion,
): GeocodedLocation {
  return {
    lat: suggestion.lat,
    lng: suggestion.lng,
    formatted_address: suggestion.place_name,
    town_name: suggestion.town_name,
    provider: "geoapify",
  };
}

/**
 * Search and transform addresses for autocomplete.
 *
 * Convenience function that combines search and transformation. Applies the
 * authoritative Westchester county gate so only Westchester County addresses
 * are surfaced.
 */
export async function searchAndTransformAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const results = await searchAddresses(query.trim(), signal);
  return results.filter(isWestchesterResult).map(transformToSuggestion);
}
