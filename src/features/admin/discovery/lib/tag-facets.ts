// PORTED FROM buzlee-app/src/features/filter/lib/tag-facets.ts — keep in sync; see docs/admin-sync.md
import type { FlyerWithDetails } from "@/entities/flyer/model/types";

/** A tag the filter sheet offers, with how many flyers on the surface carry it. */
export type TagFacet = { id: string; name: string; count: number };

/** Flyers carrying at least one of the tags (any-match). No tags selected keeps every flyer. */
export function filterFlyersByTags(
  flyers: FlyerWithDetails[],
  tagIds: readonly string[],
): FlyerWithDetails[] {
  if (tagIds.length === 0) return flyers;
  const wanted = new Set(tagIds);
  return flyers.filter((flyer) =>
    flyer.tags?.some((tag) => wanted.has(tag.id)),
  );
}

/**
 * The tags on these flyers, most used first, then by name.
 *
 * Pass the surface's flyers with every filter applied except tags
 * (disjunctive faceting): the counts then follow town, date and time, and
 * picking one tag never hides the others. Tags no flyer carries are left out,
 * so the sheet never offers a filter that returns nothing.
 */
export function computeTagFacets(flyers: FlyerWithDetails[]): TagFacet[] {
  const byId = new Map<string, TagFacet>();
  for (const flyer of flyers) {
    for (const tag of flyer.tags ?? []) {
      const facet = byId.get(tag.id);
      if (facet) facet.count += 1;
      else byId.set(tag.id, { id: tag.id, name: tag.name, count: 1 });
    }
  }
  return [...byId.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}
