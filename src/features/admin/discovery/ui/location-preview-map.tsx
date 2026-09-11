"use client";

import { Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { MapCoordinate } from "../lib/map-coordinates";
import { isMapConfigured } from "../lib/map-style";
import { themeColor } from "../lib/theme-color";
import { FOCUS_FLYER_ZOOM } from "./flyer-map";
import { useMapLibre } from "./use-maplibre";

function PreviewMap({ lat, lng }: MapCoordinate) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, error } = useMapLibre(containerRef, {
    center: [lng, lat],
    zoom: FOCUS_FLYER_ZOOM,
    interactive: false,
  });

  useEffect(() => {
    if (!map) return;
    const marker = new Marker({
      color: themeColor(map.getContainer(), "primary"),
    })
      .setLngLat([lng, lat])
      .addTo(map);
    map.jumpTo({ center: [lng, lat] });
    return () => {
      marker.remove();
    };
  }, [map, lat, lng]);

  // Decorative preview: nothing to show when WebGL is unavailable.
  if (error) return null;
  // Frame on the wrapper; the inner div belongs to MapLibre (see useMapLibre).
  return (
    <div
      aria-hidden
      className="h-44 w-full overflow-hidden rounded-xl border border-border"
    >
      <div className="h-full w-full" ref={containerRef} />
    </div>
  );
}

/**
 * Static map preview with a single pin — shows the flyer wizard's Location
 * step where the chosen address lands (the app renders the same preview
 * under its address field). Renders nothing when the map key is unset so
 * the wizard is never blocked on map configuration.
 */
export function LocationPreviewMap({
  coordinate,
}: {
  coordinate: MapCoordinate | null;
}) {
  if (!coordinate || !isMapConfigured()) return null;
  return (
    <PreviewMap
      key={`${coordinate.lat},${coordinate.lng}`}
      lat={coordinate.lat}
      lng={coordinate.lng}
    />
  );
}
