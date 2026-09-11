export const DISCOVERY_PATH = "/admin/tools/map";

export type DiscoveryView = "map" | "list";

/** Deep link into the discovery map, optionally focused on one flyer (the app's `?flyerId=`). */
export function discoveryMapHref(flyerId?: string | null): string {
  return flyerId
    ? `${DISCOVERY_PATH}?flyerId=${encodeURIComponent(flyerId)}`
    : DISCOVERY_PATH;
}

export function discoveryHref(view: DiscoveryView): string {
  return view === "list" ? `${DISCOVERY_PATH}?view=list` : DISCOVERY_PATH;
}
