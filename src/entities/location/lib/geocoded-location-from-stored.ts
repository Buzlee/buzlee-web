// PORTED FROM buzlee-app/src/entities/location/lib/geocoded-location-from-stored.ts — keep in sync; see docs/admin-sync.md
import type { GeocodedLocation } from "../model/types";

/**
 * Parses business.location (JSONB) into GeocodedLocation for AddressEntryField.
 * Lenient: does not enforce Westchester bounds so legacy rows still display.
 */
export function geocodedLocationFromStoredJson(
  value: unknown,
): GeocodedLocation | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const lat = o.lat;
  const lng = o.lng;
  const formatted_address = o.formatted_address;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (typeof formatted_address !== "string" || !formatted_address.trim())
    return null;
  return {
    lat,
    lng,
    formatted_address: formatted_address.trim(),
    unit:
      typeof o.unit === "string" && o.unit.trim() ? o.unit.trim() : undefined,
    town_name: typeof o.town_name === "string" ? o.town_name : undefined,
    // Preserve the stored provider; default legacy rows (no provider) to 'maptiler'.
    provider: o.provider === "geoapify" ? "geoapify" : "maptiler",
  };
}
