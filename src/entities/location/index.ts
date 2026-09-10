// Web barrel — mirrors buzlee-app/src/entities/location/index.ts minus the
// RN-only UI (AddressEntryField / AddressPickerSheet / AddressSearchPanel),
// town-matching, and the zod location schemas (web has no zod dependency).
// The web address picker lives in features/admin/components/address-field.tsx.

// API - Geocoding Service
export {
  GeocodingError,
  geocodedLocationFromSuggestion,
  isClientGeocodingError,
  isWestchesterResult,
  isWithinWestchesterBounds,
  searchAddresses,
  searchAndTransformAddresses,
  transformToGeocodedLocation,
  transformToSuggestion,
} from "./api/geocoding-service";
// API - React Query Hooks
export {
  locationKeys,
  useAddressSearch,
  useDebounce,
} from "./api/use-location";
export {
  composeAddressWithUnit,
  formattedAddressFromLocation,
} from "./lib/formatted-address";
export { geocodedLocationFromStoredJson } from "./lib/geocoded-location-from-stored";
export {
  BUSINESS_ADDRESS_SHEET_TITLE,
  EVENT_ADDRESS_SHEET_TITLE,
  WESTCHESTER_ADDRESS_SEARCH_PLACEHOLDER,
} from "./model/address-field-copy";
export {
  ADDRESS_SEARCH_MIN_QUERY_LENGTH,
  normalizeAddressQuery,
} from "./model/address-search";
// Types
export type {
  AddressSuggestion,
  GeoapifyAutocompleteResponse,
  GeoapifyResult,
  GeocodedLocation,
  GeocodeProvider,
  GeoPoint,
} from "./model/types";
