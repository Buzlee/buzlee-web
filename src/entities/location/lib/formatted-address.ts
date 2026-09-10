// PORTED FROM buzlee-app/src/entities/location/lib/formatted-address.ts — keep in sync; see docs/admin-sync.md
import type { GeocodedLocation } from "../model/types";

/**
 * Inserts a user-entered unit after the street segment of a formatted address:
 * "123 Main St, Suite 4B, White Plains, NY 10601".
 * Unit is display-only — never part of the geocoded `formatted_address`.
 */
export function composeAddressWithUnit(
  formattedAddress: string,
  unit?: string | null,
): string {
  const base = formattedAddress.trim();
  const u = unit?.trim();
  if (!u) return base;
  const commaIdx = base.indexOf(",");
  if (commaIdx === -1) return `${base}, ${u}`;
  return `${base.slice(0, commaIdx)}, ${u}${base.slice(commaIdx)}`;
}

/**
 * Display string for a stored location JSON or GeocodedLocation (shared by profile and lists).
 * Includes the user-entered unit when present.
 */
export function formattedAddressFromLocation(
  location: unknown,
): string | undefined {
  if (!location || typeof location !== "object") return undefined;
  const loc = location as GeocodedLocation;
  const raw = loc.formatted_address;
  if (raw == null) return undefined;
  const t = String(raw).trim();
  if (t.length === 0) return undefined;
  return composeAddressWithUnit(
    t,
    typeof loc.unit === "string" ? loc.unit : undefined,
  );
}
