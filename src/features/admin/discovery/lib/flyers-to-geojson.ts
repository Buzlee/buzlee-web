// PORTED FROM buzlee-app/src/features/map/lib/flyers-to-geojson.ts — keep in sync; see docs/admin-sync.md
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { isValidCoordinate, type MapCoordinate } from "./map-coordinates";

export function flyersToGeoJSON(
  flyers: FlyerWithDetails[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: flyers
      .filter((f) => isValidCoordinate(f.location))
      .map((flyer) => {
        const location = flyer.location as MapCoordinate;
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [location.lng, location.lat],
          },
          properties: {
            flyerId: flyer.id,
          },
        };
      }),
  };
}
