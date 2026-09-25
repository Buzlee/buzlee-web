"use client";

import { LayoutList, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFlyer, useFlyers } from "@/entities/flyer/api/use-flyer";
import {
  getFlyerSortTimestamp,
  isFlyerEventUpcomingForDiscovery,
} from "@/entities/flyer/lib/flyer-helper";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { SegmentedControl } from "@/features/admin/components/segmented-control";
import { cn } from "@/lib/utils";
import { type DiscoveryView, discoveryHref } from "../lib/discovery-href";
import { filterStateToFlyerFilters } from "../lib/filter-state-to-flyer-filters";
import {
  coordinateFromFlyerLocation,
  isValidCoordinate,
} from "../lib/map-coordinates";
import { isMapConfigured } from "../lib/map-style";
import { useFilterStore } from "../model/use-filter-state";
import { useTagFacetedFlyers } from "../model/use-tag-faceted-flyers";
import { CategoryChips } from "./category-chips";
import { FilterSheet } from "./filter-sheet";
import { FlyerDetailPanel, FlyerStackPanel } from "./flyer-detail-panel";
import { FlyerFeed } from "./flyer-feed";
import { FlyerMap, type FlyerMapFocus, FOCUS_FLYER_ZOOM } from "./flyer-map";

const VIEW_OPTIONS: { value: DiscoveryView; label: string }[] = [
  { value: "map", label: "Map" },
  { value: "list", label: "List" },
];

/** Detail panel width; the map camera is padded by this while it is open. */
const PANEL_WIDTH = 360;

/** Selection: a single flyer, or a co-located stack to pick from. */
type Selection =
  | { kind: "none" }
  | { kind: "stack"; flyerIds: string[] }
  | { kind: "flyer"; flyerId: string; fromStack?: string[] };

/**
 * Admin discovery: the live flyer dataset exactly as residents see it, for
 * platform oversight. Read-only — moderation happens on the flyer review
 * page. Web port of the app's `(admin-detail)/discovery-map` and
 * `discovery-feed` screens, sharing one filter store and one route with a
 * Map / List toggle (`?view=list`) and the app's `?flyerId=` deep link.
 */
export function DiscoveryScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view: DiscoveryView =
    searchParams.get("view") === "list" ? "list" : "map";
  const flyerIdParam = searchParams.get("flyerId");

  const [filterOpen, setFilterOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [focus, setFocus] = useState<FlyerMapFocus | null>(null);

  // Select each slice individually (stable snapshots), as the app does.
  const selectedTagIds = useFilterStore((s) => s.selectedTagIds);
  const selectedCategoryIds = useFilterStore((s) => s.selectedCategoryIds);
  const selectedTownIds = useFilterStore((s) => s.selectedTownIds);
  const datePreset = useFilterStore((s) => s.datePreset);
  const dateRange = useFilterStore((s) => s.dateRange);
  const timeOfDay = useFilterStore((s) => s.timeOfDay);
  const activeFilterCount = useFilterStore((s) => s.getActiveFilterCount());

  const filters = useMemo(
    () =>
      filterStateToFlyerFilters(
        {
          selectedCategoryIds,
          selectedTownIds,
          datePreset,
          dateRange,
          timeOfDay,
        },
        { restrictToLiveFlyers: true },
      ),
    [selectedCategoryIds, selectedTownIds, datePreset, dateRange, timeOfDay],
  );

  const { data: flyersBeforeTagFilter = [], isLoading } = useFlyers(filters);
  const { flyers, tagFacets } = useTagFacetedFlyers(
    flyersBeforeTagFilter,
    selectedTagIds,
  );
  const { data: focusFlyerDetail } = useFlyer(flyerIdParam ?? "");

  // Mobile parity: a deep-linked flyer is merged into the dataset even when
  // the current filters exclude it, so the pin can be focused and opened.
  const allFlyers = useMemo(() => {
    if (!focusFlyerDetail) return flyers;
    const idx = flyers.findIndex((f) => f.id === focusFlyerDetail.id);
    if (idx === -1) return [...flyers, focusFlyerDetail];
    const next = [...flyers];
    next[idx] = focusFlyerDetail;
    return next;
  }, [flyers, focusFlyerDetail]);

  const mapFlyers = useMemo(
    () => allFlyers.filter((flyer) => isValidCoordinate(flyer.location)),
    [allFlyers],
  );
  const feedFlyers = useMemo(
    () =>
      allFlyers
        .filter(isFlyerEventUpcomingForDiscovery)
        .sort((a, b) => getFlyerSortTimestamp(a) - getFlyerSortTimestamp(b)),
    [allFlyers],
  );
  const flyersById = useMemo(
    () => new Map(allFlyers.map((flyer) => [flyer.id, flyer])),
    [allFlyers],
  );

  // Consume `?flyerId=`: fly to the flyer, select it, then strip the param
  // (the app clears it on blur so a later visit starts fresh).
  useEffect(() => {
    if (!flyerIdParam || !focusFlyerDetail) return;
    const coordinate = coordinateFromFlyerLocation(focusFlyerDetail.location);
    if (coordinate) setFocus({ coordinate, zoom: FOCUS_FLYER_ZOOM });
    setSelection({ kind: "flyer", flyerId: focusFlyerDetail.id });
    const params = new URLSearchParams(searchParams.toString());
    params.delete("flyerId");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [flyerIdParam, focusFlyerDetail, pathname, router, searchParams]);

  // The panel keeps rendering its last content while it slides out, so a
  // close never blanks the panel a frame before it leaves.
  const [panelSelection, setPanelSelection] = useState<Selection>(selection);
  if (selection.kind !== "none" && selection !== panelSelection) {
    setPanelSelection(selection);
  }

  // Live highlight for the map pin / list card — clears the moment the panel
  // closes, unlike the panel content above.
  const activeFlyerId = selection.kind === "flyer" ? selection.flyerId : null;

  const selectedFlyer =
    panelSelection.kind === "flyer"
      ? (flyersById.get(panelSelection.flyerId) ?? null)
      : null;
  const stackFlyers =
    panelSelection.kind === "stack"
      ? panelSelection.flyerIds
          .map((id) => flyersById.get(id))
          .filter((flyer): flyer is FlyerWithDetails => flyer !== undefined)
      : [];

  function handleMapSelect(flyerIds: string[]) {
    if (flyerIds.length === 0) setSelection({ kind: "none" });
    else if (flyerIds.length === 1)
      setSelection({ kind: "flyer", flyerId: flyerIds[0] });
    else setSelection({ kind: "stack", flyerIds });
  }

  function handleShowOnMap(flyer: FlyerWithDetails) {
    const coordinate = coordinateFromFlyerLocation(flyer.location);
    if (coordinate) setFocus({ coordinate, zoom: FOCUS_FLYER_ZOOM });
    setSelection({ kind: "flyer", flyerId: flyer.id });
    router.replace(discoveryHref("map"), { scroll: false });
  }

  const showPanel = selection.kind !== "none";
  const mapConfigured = isMapConfigured();
  const panelRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const closePanel = useCallback(() => {
    setSelection({ kind: "none" });
    const opener = openerRef.current;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }, []);

  // Escape closes the panel from anywhere (focus is usually on the map
  // canvas after a pin click). On open, the Close button takes focus so
  // keyboard users land inside the panel; on close, focus goes back to
  // whatever had it before the panel went `inert` under it.
  useEffect(() => {
    if (!showPanel) return;
    const active = document.activeElement;
    openerRef.current =
      active instanceof HTMLElement && !panelRef.current?.contains(active)
        ? active
        : null;
    panelRef.current
      ?.querySelector<HTMLButtonElement>('button[aria-label="Close"]')
      ?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showPanel, closePanel]);

  return (
    <div className="flex h-[calc(100svh-72px)] min-h-[560px] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
          <div className="flex w-max gap-2">
            <CategoryChips />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setFilterOpen(true)}
            type="button"
            variant="outline"
          >
            <SlidersHorizontal />
            Filters
            {activeFilterCount > 0 ? (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background tabular-nums">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <SegmentedControl
            aria-label="View"
            idBase="discovery-view"
            onChange={(next) =>
              router.replace(discoveryHref(next), { scroll: false })
            }
            options={VIEW_OPTIONS}
            value={view}
          />
        </div>
      </div>

      <div
        aria-labelledby={`discovery-view-tab-${view}`}
        className="relative flex min-h-0 flex-1"
        id="discovery-view"
        role="tabpanel"
      >
        <div className="relative min-w-0 flex-1">
          {view === "map" ? (
            mapConfigured ? (
              <>
                <FlyerMap
                  className="absolute inset-0"
                  flyers={mapFlyers}
                  focus={focus}
                  onSelect={handleMapSelect}
                  panelInset={showPanel ? PANEL_WIDTH : 0}
                  selectedFlyerId={activeFlyerId}
                />
                <div className="pointer-events-none absolute top-3 left-3 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
                  <MapIcon className="mr-1.5 inline size-3.5" />
                  {isLoading
                    ? "Loading…"
                    : `${mapFlyers.length} live flyer${mapFlyers.length === 1 ? "" : "s"} on the map`}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <MapIcon className="size-8 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  MapTiler API key is not configured
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Set <code>NEXT_PUBLIC_MAPTILER_API_KEY</code> for this
                  environment to render the map. The list view still works.
                </p>
              </div>
            )
          ) : (
            <div className="h-full overflow-y-auto">
              {/* Section headers carry the counts; this line only covers the
                  moment before they exist. */}
              {isLoading && feedFlyers.length === 0 ? (
                <div className="flex items-center gap-1.5 px-6 pt-5 text-[13px] font-medium text-muted-foreground">
                  <LayoutList className="size-3.5" />
                  Loading…
                </div>
              ) : null}
              <FlyerFeed
                flyers={feedFlyers}
                isLoading={isLoading}
                onSelect={(flyer) =>
                  setSelection({ kind: "flyer", flyerId: flyer.id })
                }
                selectedFlyerId={activeFlyerId}
              />
            </div>
          )}
        </div>

        {/* Overlays the map (like the app's sheet) instead of sharing the
            row with it: a transform slide, so the map never reflows. */}
        <aside
          aria-label="Selected flyer"
          className={cn(
            "absolute inset-y-0 right-0 z-10 w-(--panel-width) max-w-full bg-card shadow-[-12px_0_32px_-16px_rgb(15_23_42/0.25)] transition-[translate,opacity,visibility] duration-200 ease-out-strong",
            "data-[state=closed]:invisible data-[state=closed]:translate-x-3 data-[state=closed]:opacity-0 data-[state=closed]:duration-150",
            "motion-reduce:data-[state=closed]:translate-x-0",
          )}
          data-state={showPanel ? "open" : "closed"}
          inert={!showPanel}
          ref={panelRef}
          style={{ "--panel-width": `${PANEL_WIDTH}px` } as React.CSSProperties}
        >
          {selectedFlyer ? (
            <FlyerDetailPanel
              flyer={selectedFlyer}
              onBack={
                panelSelection.kind === "flyer" && panelSelection.fromStack
                  ? () =>
                      setSelection({
                        kind: "stack",
                        flyerIds: panelSelection.fromStack ?? [],
                      })
                  : undefined
              }
              onClose={closePanel}
              onShowOnMap={view === "list" ? handleShowOnMap : undefined}
            />
          ) : stackFlyers.length > 0 ? (
            <FlyerStackPanel
              flyers={stackFlyers}
              onClose={closePanel}
              onSelect={(flyer) =>
                setSelection({
                  kind: "flyer",
                  flyerId: flyer.id,
                  fromStack: stackFlyers.map((f) => f.id),
                })
              }
            />
          ) : null}
        </aside>
      </div>

      <FilterSheet
        onOpenChange={setFilterOpen}
        open={filterOpen}
        tagFacets={tagFacets}
      />
    </div>
  );
}
