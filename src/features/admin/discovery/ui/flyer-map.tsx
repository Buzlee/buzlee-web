"use client";

import { MapPinOff } from "lucide-react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  MapLayerMouseEvent,
} from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { flyersToGeoJSON } from "../lib/flyers-to-geojson";
import { MAP_ZOOM, NATIVE_CLUSTER } from "../lib/map-constants";
import type { MapCoordinate } from "../lib/map-coordinates";
import { themeColor } from "../lib/theme-color";
import { useMapLibre } from "./use-maplibre";

const SOURCE_ID = "flyers";
const LAYER_CLUSTERS = "flyer-clusters";
const LAYER_CLUSTER_COUNT = "flyer-cluster-count";
const LAYER_POINTS = "flyer-points";

/** Same zoom the app flies to for a `?flyerId=` deep link. */
export const FOCUS_FLYER_ZOOM = 15;

export type FlyerMapFocus = { coordinate: MapCoordinate; zoom?: number };

/**
 * Discovery map: every live flyer with coordinates as a pin, clustered with
 * MapLibre's native GeoJSON clustering using the app's `NATIVE_CLUSTER`
 * radius / max-zoom. Clicking a cluster zooms to its expansion zoom; clicking
 * a pin reports every flyer rendered at that point (co-located flyers past
 * the cluster max-zoom arrive together, like the app's colocated stack).
 */
export function FlyerMap({
  flyers,
  selectedFlyerId,
  focus,
  onSelect,
  panelInset = 0,
  className,
}: {
  flyers: FlyerWithDetails[];
  selectedFlyerId: string | null;
  /** Width (px) of an overlay covering the map's right edge; the camera keeps
   * its centre — and any fly-to target — inside the uncovered area. */
  panelInset?: number;
  /** Camera target; the map flies whenever this object identity changes. */
  focus: FlyerMapFocus | null;
  onSelect: (flyerIds: string[]) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, error } = useMapLibre(containerRef);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Source + layers, once per map instance.
  useEffect(() => {
    if (!map) return;
    const canvas = map.getCanvas();
    const container = map.getContainer();
    const primary = themeColor(container, "primary");
    const ink = themeColor(container, "foreground");
    const paper = themeColor(container, "background");

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: flyersToGeoJSON([]),
      cluster: true,
      clusterRadius: NATIVE_CLUSTER.RADIUS,
      clusterMaxZoom: NATIVE_CLUSTER.MAX_ZOOM,
    });
    map.addLayer({
      id: LAYER_CLUSTERS,
      type: "circle",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": ink,
        "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
        "circle-stroke-width": 3,
        "circle-stroke-color": paper,
      },
    });
    map.addLayer({
      id: LAYER_CLUSTER_COUNT,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: { "text-color": paper },
    });
    map.addLayer({
      id: LAYER_POINTS,
      type: "circle",
      source: SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": primary,
        "circle-radius": 8,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": paper,
        // Selection highlight (below) eases all three together.
        "circle-radius-transition": { duration: 150 },
        "circle-stroke-width-transition": { duration: 150 },
        "circle-stroke-color-transition": { duration: 150 },
      },
    });

    const setCursor = (cursor: string) => {
      canvas.style.cursor = cursor;
    };
    const onEnter = () => setCursor("pointer");
    const onLeave = () => setCursor("");

    let disposed = false;
    const onClusterClick = async (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      if (feature?.geometry.type !== "Point" || typeof clusterId !== "number")
        return;
      const source = map.getSource<GeoJSONSource>(SOURCE_ID);
      if (!source) return;
      // Resolved by the worker; the map may have been removed meanwhile.
      const expansionZoom = await source
        .getClusterExpansionZoom(clusterId)
        .catch(() => null);
      if (disposed || expansionZoom === null) return;
      map.easeTo({
        center: feature.geometry.coordinates as [number, number],
        zoom: Math.min(MAP_ZOOM.MAX, expansionZoom),
      });
    };

    const onPointClick = (event: MapLayerMouseEvent) => {
      const ids = (event.features ?? [])
        .map((feature) => feature.properties?.flyerId)
        .filter((id): id is string => typeof id === "string");
      if (ids.length > 0) onSelectRef.current([...new Set(ids)]);
    };

    const subscriptions = [
      map.on("mouseenter", LAYER_CLUSTERS, onEnter),
      map.on("mouseleave", LAYER_CLUSTERS, onLeave),
      map.on("mouseenter", LAYER_POINTS, onEnter),
      map.on("mouseleave", LAYER_POINTS, onLeave),
      map.on("click", LAYER_CLUSTERS, onClusterClick),
      map.on("click", LAYER_POINTS, onPointClick),
    ];

    return () => {
      disposed = true;
      for (const subscription of subscriptions) subscription.unsubscribe();
      // The map itself is removed by useMapLibre; layers die with it.
    };
  }, [map]);

  // Data.
  useEffect(() => {
    map?.getSource<GeoJSONSource>(SOURCE_ID)?.setData(flyersToGeoJSON(flyers));
  }, [map, flyers]);

  // Selection highlight: the chosen pin grows and gets an ink ring, so it
  // reads as "this one" even inside a dense cluster of amber dots.
  useEffect(() => {
    if (!map) return;
    const isSelected: ExpressionSpecification = [
      "==",
      ["get", "flyerId"],
      selectedFlyerId ?? "",
    ];
    const ink = themeColor(map.getContainer(), "foreground");
    const paper = themeColor(map.getContainer(), "background");
    map.setPaintProperty(LAYER_POINTS, "circle-radius", [
      "case",
      isSelected,
      11,
      8,
    ]);
    map.setPaintProperty(LAYER_POINTS, "circle-stroke-width", [
      "case",
      isSelected,
      3,
      2.5,
    ]);
    map.setPaintProperty(LAYER_POINTS, "circle-stroke-color", [
      "case",
      isSelected,
      ink,
      paper,
    ]);
  }, [map, selectedFlyerId]);

  // Camera padding persists, so later flyTo / easeTo calls centre within the
  // visible part of the map rather than under the panel.
  useEffect(() => {
    if (!map) return;
    map.easeTo({ padding: { right: panelInset }, duration: 200 });
  }, [map, panelInset]);

  // Camera. Padding is passed explicitly: a flyTo interrupts the padding
  // ease above, so relying on the transform's current padding would centre
  // the target under the panel.
  const panelInsetRef = useRef(panelInset);
  panelInsetRef.current = panelInset;
  useEffect(() => {
    if (!map || !focus) return;
    map.flyTo({
      center: [focus.coordinate.lng, focus.coordinate.lat],
      zoom: focus.zoom ?? FOCUS_FLYER_ZOOM,
      padding: { right: panelInsetRef.current },
      duration: 500,
    });
  }, [map, focus]);

  // Layout lives on the wrapper; the inner div is MapLibre's (see useMapLibre).
  return (
    <div className={className}>
      {error ? (
        <div
          className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center"
          role="alert"
        >
          <MapPinOff className="size-8 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            The map can’t be displayed in this browser
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            WebGL2 is required. Try another browser, or use the List view.
          </p>
        </div>
      ) : (
        <div className="h-full w-full" ref={containerRef} />
      )}
    </div>
  );
}
