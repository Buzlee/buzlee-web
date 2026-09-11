"use client";

import { Map as MapLibreMap, setWorkerUrl } from "maplibre-gl";
import { type RefObject, useEffect, useState } from "react";
import { MAP_BOUNDARIES, MAP_ZOOM } from "../lib/map-constants";
import { currentMapColorScheme, mapStyleUrl } from "../lib/map-style";
import "maplibre-gl/dist/maplibre-gl.css";

// MapLibre's default worker URL is derived from import.meta.url, which the
// bundler rewrites — the request 404s and the map renders nothing. The worker
// bundle is copied into public/ on postinstall (scripts/copy-maplibre-worker.mjs).
setWorkerUrl("/vendor/maplibre-gl/maplibre-gl-worker.mjs");

export type UseMapLibreOptions = {
  center?: [number, number];
  zoom?: number;
  /** false → static preview (no pan / zoom / keyboard). */
  interactive?: boolean;
};

/**
 * Mounts a MapLibre GL JS map into `containerRef` with the app's shared camera
 * constraints (Westchester bounds, zoom range, no rotate/pitch — mobile sets
 * `touchPitch={false} touchRotate={false}`) and the MapTiler style for the
 * current colour scheme. Resolves to the map once its style has loaded;
 * removed on unmount. Callers must only mount it when `isMapConfigured()`.
 */
export function useMapLibre(
  containerRef: RefObject<HTMLDivElement | null>,
  { center, zoom, interactive = true }: UseMapLibreOptions = {},
): MapLibreMap | null {
  const [map, setMap] = useState<MapLibreMap | null>(null);

  // Camera defaults are read once at mount; later prop changes are driven by
  // the caller through map.easeTo / flyTo.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instance = new MapLibreMap({
      container,
      style: mapStyleUrl(currentMapColorScheme()),
      center: center ?? MAP_BOUNDARIES.center,
      zoom: zoom ?? MAP_ZOOM.DEFAULT,
      minZoom: MAP_ZOOM.MIN,
      maxZoom: MAP_ZOOM.MAX,
      maxBounds: [MAP_BOUNDARIES.sw, MAP_BOUNDARIES.ne],
      interactive,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
    });
    instance.touchZoomRotate.disableRotation();
    instance.keyboard.disableRotation();

    instance.once("load", () => setMap(instance));

    return () => {
      setMap(null);
      instance.remove();
    };
  }, []);

  return map;
}
