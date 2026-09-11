"use client";

import { Marker } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { MapCoordinate } from "../lib/map-coordinates";
import { isMapConfigured } from "../lib/map-style";
import { themeColor } from "../lib/theme-color";
import { FOCUS_FLYER_ZOOM } from "./flyer-map";
import { useMapLibre } from "./use-maplibre";

function PreviewMap({ coordinate }: { coordinate: MapCoordinate }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const map = useMapLibre(containerRef, {
    center: [coordinate.lng, coordinate.lat],
    zoom: FOCUS_FLYER_ZOOM,
    interactive: false,
  });

  useEffect(() => {
    if (!map) return;
    const marker = new Marker({
      color: themeColor(map.getContainer(), "primary"),
    })
      .setLngLat([coordinate.lng, coordinate.lat])
      .addTo(map);
    map.jumpTo({ center: [coordinate.lng, coordinate.lat] });
    return () => {
      marker.remove();
    };
  }, [map, coordinate]);

  return <div className="h-full w-full" ref={containerRef} />;
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
    <div
      aria-hidden
      className="h-44 w-full overflow-hidden rounded-xl border border-border"
    >
      <PreviewMap
        coordinate={coordinate}
        key={`${coordinate.lat},${coordinate.lng}`}
      />
    </div>
  );
}
