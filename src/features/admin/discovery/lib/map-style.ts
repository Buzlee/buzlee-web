/**
 * MapTiler style URLs — the same two hosted maps `DiscoveryMapView` uses in
 * buzlee-app (light / dark). The key is public by design (it ships in the
 * mobile bundle too); restrict it to the admin origins in the MapTiler
 * console. Unset → the map tools render a "not configured" notice instead
 * of a broken map, and the wizard's location preview is omitted.
 */
const MAPTILER_API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

const MAPTILER_MAP_IDS = {
  light: "019c4de4-8b55-77ba-8750-5fc5e27c7659",
  dark: "019c5ef2-12da-7641-a4d3-521f0bdd4058",
} as const;

export type MapColorScheme = keyof typeof MAPTILER_MAP_IDS;

export function isMapConfigured(): boolean {
  return Boolean(MAPTILER_API_KEY);
}

export function mapStyleUrl(scheme: MapColorScheme): string {
  return `https://api.maptiler.com/maps/${MAPTILER_MAP_IDS[scheme]}/style.json?key=${MAPTILER_API_KEY}`;
}

/** The dashboard's dark mode is class-based (`.dark` on <html>). */
export function currentMapColorScheme(): MapColorScheme {
  return typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}
