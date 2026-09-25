// PORTED FROM buzlee-app/src/features/filter/model/use-tag-faceted-flyers.ts — keep in sync; see docs/admin-sync.md
import { useMemo } from "react";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import {
  computeTagFacets,
  filterFlyersByTags,
  type TagFacet,
} from "../lib/tag-facets";

/**
 * Applies the tag filter on the client and derives the filter sheet's tag
 * options from the same dataset.
 *
 * `flyersBeforeTagFilter` is the surface's query result with every filter
 * except tags. Tags stay out of the query key, so toggling a tag is instant
 * (no refetch), and refreshes of that query refresh the options too.
 */
export function useTagFacetedFlyers(
  flyersBeforeTagFilter: FlyerWithDetails[],
  selectedTagIds: string[],
): { flyers: FlyerWithDetails[]; tagFacets: TagFacet[] } {
  const tagFacets = useMemo(
    () => computeTagFacets(flyersBeforeTagFilter),
    [flyersBeforeTagFilter],
  );
  const flyers = useMemo(
    () => filterFlyersByTags(flyersBeforeTagFilter, selectedTagIds),
    [flyersBeforeTagFilter, selectedTagIds],
  );
  return { flyers, tagFacets };
}
