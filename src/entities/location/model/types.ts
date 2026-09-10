// PORTED FROM buzlee-app/src/entities/location/model/types.ts — keep in sync; see docs/admin-sync.md
/**
 * Location types for geocoding and address management
 */

/**
 * GeoPoint stored in database (location JSONB column)
 */
export type GeoPoint = {
  lat: number;
  lng: number;
};

/**
 * Identifier for the geocoding provider that produced a location.
 * `'maptiler'` is retained so legacy rows stored before the Geoapify
 * migration remain valid; new writes use `'geoapify'`.
 */
export type GeocodeProvider = "maptiler" | "geoapify";

/**
 * Full geocoding result
 * This is what gets stored in the database and passed to forms
 */
export type GeocodedLocation = {
  lat: number;
  lng: number;
  formatted_address: string;
  // User-entered apt/suite/unit. Never sent to the geocoder; appended at display time.
  unit?: string;
  town_name?: string; // Locality/city for the address
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  provider: GeocodeProvider;
};

/**
 * Geoapify Address Autocomplete result (format=json).
 *
 * With `format=json` each result is a FLAT object — fields are at the top
 * level of the result, NOT nested under a `properties` key (that nesting only
 * happens with `format=geojson`). Coordinates are longitude-first per Geoapify.
 */
export type GeoapifyResult = {
  lat: number;
  lon: number;
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
  place_id: string;
  result_type?: string;
  rank?: { confidence?: number };
};

/**
 * Geoapify Address Autocomplete API response (format=json)
 */
export type GeoapifyAutocompleteResponse = {
  results: GeoapifyResult[];
};

/**
 * Address search result for UI display
 * Simplified version of a Geoapify result for autocomplete suggestions
 */
export type AddressSuggestion = {
  id: string;
  place_name: string;
  lat: number;
  lng: number;
  town_name?: string;
};
