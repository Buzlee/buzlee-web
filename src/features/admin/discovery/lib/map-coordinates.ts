// PORTED FROM buzlee-app/src/features/map/lib/map-coordinates.ts — keep in sync; see docs/admin-sync.md
// Web trim: the coordinate type, validator and flyer-location parser. The
// distance / bounds / zoom-to-fit helpers serve the resident carousel only.
/**
 * Map coordinates domain model
 * Provides type-safe coordinate validation and utilities
 */

export type MapCoordinate = {
  readonly lat: number;
  readonly lng: number;
};

/**
 * Type guard to validate if a value is a valid MapCoordinate
 */
export function isValidCoordinate(value: unknown): value is MapCoordinate {
  if (!value || typeof value !== "object") return false;

  const coord = value as Record<string, unknown>;

  if (typeof coord.lat !== "number" || typeof coord.lng !== "number")
    return false;
  if (!Number.isFinite(coord.lat) || !Number.isFinite(coord.lng)) return false;

  // Valid lat: -90 to 90, lng: -180 to 180
  return (
    coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180
  );
}

/**
 * Parses flyer.location JSON (lat/lng may be numbers or numeric strings from Supabase JSON).
 */
export function coordinateFromFlyerLocation(
  value: unknown,
): MapCoordinate | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const latRaw = o.lat;
  const lngRaw = o.lng;
  const lat =
    typeof latRaw === "number"
      ? latRaw
      : typeof latRaw === "string"
        ? Number(latRaw)
        : Number.NaN;
  const lng =
    typeof lngRaw === "number"
      ? lngRaw
      : typeof lngRaw === "string"
        ? Number(lngRaw)
        : Number.NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
