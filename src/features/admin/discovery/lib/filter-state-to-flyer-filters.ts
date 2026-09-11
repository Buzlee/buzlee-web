// PORTED FROM buzlee-app/src/features/discovery/lib/filter-state-to-flyer-filters.ts — keep in sync; see docs/admin-sync.md
import type { FlyerFilters } from "@/entities/flyer/model/types";
import type { FilterState } from "../model/filter-types";

type FilterSlice = Pick<
  FilterState,
  | "selectedTagIds"
  | "selectedCategoryIds"
  | "selectedTownIds"
  | "datePreset"
  | "dateRange"
  | "timeOfDay"
>;

/**
 * Maps shared filter UI state to entity {@link FlyerFilters}.
 * Resident discovery sets `restrictToLiveFlyers`; business preview omits `isLive` and relies on RLS.
 */
export function filterStateToFlyerFilters(
  state: FilterSlice,
  options: { restrictToLiveFlyers: boolean },
): FlyerFilters {
  const f: FlyerFilters = {};
  if (options.restrictToLiveFlyers) {
    f.isLive = true;
  }
  if (state.selectedTagIds.length > 0) f.tagIds = state.selectedTagIds;
  if (state.selectedCategoryIds.length > 0)
    f.categoryIds = state.selectedCategoryIds;
  if (state.selectedTownIds.length > 0) f.townIds = state.selectedTownIds;
  if (state.datePreset !== "all") {
    f.datePreset = state.datePreset;
  }
  if (state.dateRange.from && state.dateRange.to) {
    f.dateFrom = state.dateRange.from;
    f.dateTo = state.dateRange.to;
  }
  if (state.timeOfDay) f.timeOfDay = state.timeOfDay;
  return f;
}
