// PORTED FROM buzlee-app/src/entities/business/lib/business-address-update.ts — keep in sync; see docs/admin-sync.md
import {
  composeAddressWithUnit,
  type GeocodedLocation,
} from "@/entities/location";
import type { BusinessUpdate } from "../model/types";

/**
 * Maps a picked geocoded result to `useUpdateBusiness` / `updateBusiness` fields (single source of truth).
 */
export function businessUpdateFromGeocodedLocation(
  location: GeocodedLocation,
): Pick<BusinessUpdate, "address" | "location"> {
  return {
    address: composeAddressWithUnit(location.formatted_address, location.unit),
    location: {
      lat: location.lat,
      lng: location.lng,
      formatted_address: location.formatted_address,
      unit: location.unit,
      town_name: location.town_name,
      provider: location.provider,
    },
  };
}
