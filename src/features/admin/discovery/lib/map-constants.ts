// PORTED FROM buzlee-app/src/features/map/lib/map-constants.ts — keep in sync; see docs/admin-sync.md
// Web trim: MAP_ZOOM, MAP_BOUNDARIES and NATIVE_CLUSTER. FEATURE_FLAGS drive
// the resident carousel's hometown mode, which has no web counterpart.
/**
 * Map configuration constants
 * Single source of truth for all map-related configuration
 */

/**
 * Zoom level constraints for Westchester County map
 */
export const MAP_ZOOM = {
  MIN: 11,
  DEFAULT: 12,
  TOWN: 8,
  MAX: 17,
} as const;

/**
 * Westchester County geographic boundaries
 * All boundary-related config derives from this single source
 */
export const MAP_BOUNDARIES = {
  // Hard boundaries - the actual county extent
  ne: [-73.48, 41.37] as [number, number], // Northeast (near Putnam)
  sw: [-73.98, 40.89] as [number, number], // Southwest (near NYC)

  // Derived center point
  get center(): [number, number] {
    return [(this.ne[0] + this.sw[0]) / 2, (this.ne[1] + this.sw[1]) / 2];
  },
} as const;

/**
 * Native MapLibre clustering configuration
 * Passed directly to ShapeSource component
 */
export const NATIVE_CLUSTER = {
  RADIUS: 100,
  MAX_ZOOM: 14,
} as const;
