// Web adaptation of buzlee-app/src/features/filter/model/use-filter-state.ts — see docs/admin-sync.md
// Same state + actions and the same `useFilterStore(selector)` call shape,
// backed by a module-level store and useSyncExternalStore instead of Zustand
// (not a web dependency). Filters persist across the map ↔ list views for the
// life of the tab, as the app's global store does across its two screens.
import { useSyncExternalStore } from "react";
import {
  type DatePreset,
  DEFAULT_FILTER_STATE,
  type FilterState,
  type TimeOfDay,
} from "./filter-types";

interface FilterStore extends FilterState {
  // Actions
  setTagIds: (ids: string[]) => void;
  toggleTagId: (id: string) => void;
  setCategoryIds: (ids: string[]) => void;
  toggleCategoryId: (id: string) => void;
  setTownIds: (ids: string[]) => void;
  toggleTownId: (id: string) => void;
  setDatePreset: (preset: DatePreset) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setTimeOfDay: (time: TimeOfDay | null) => void;
  clearAll: () => void;
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

let state: FilterState = DEFAULT_FILTER_STATE;
const listeners = new Set<() => void>();

function set(patch: Partial<FilterState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((i) => i !== id) : [...list, id];

const actions: Omit<FilterStore, keyof FilterState> = {
  // Tag actions
  setTagIds: (ids) => set({ selectedTagIds: ids }),
  toggleTagId: (id) =>
    set({ selectedTagIds: toggle(state.selectedTagIds, id) }),

  // Category actions
  setCategoryIds: (ids) => set({ selectedCategoryIds: ids }),
  toggleCategoryId: (id) =>
    set({ selectedCategoryIds: toggle(state.selectedCategoryIds, id) }),

  // Town actions
  setTownIds: (ids) => set({ selectedTownIds: ids }),
  toggleTownId: (id) =>
    set({ selectedTownIds: toggle(state.selectedTownIds, id) }),

  // Date actions
  setDatePreset: (preset) =>
    set({
      datePreset: preset,
      dateRange: { from: null, to: null }, // Clear custom range when using preset
    }),

  setDateRange: (from, to) =>
    set({
      dateRange: { from, to },
      datePreset: "all", // Clear preset when using custom range
    }),

  // Time of day actions
  setTimeOfDay: (time) => set({ timeOfDay: time }),

  // Clear all filters
  clearAll: () => set(DEFAULT_FILTER_STATE),

  // Check if any filters are active
  hasActiveFilters: () =>
    state.selectedTagIds.length > 0 ||
    state.selectedTownIds.length > 0 ||
    state.datePreset !== "all" ||
    state.dateRange.from !== null ||
    state.timeOfDay !== null,

  // Get count of active filter categories
  getActiveFilterCount: () => {
    let count = 0;
    if (state.selectedTagIds.length > 0) count++;
    if (state.selectedTownIds.length > 0) count++;
    if (state.datePreset !== "all" || state.dateRange.from !== null) count++;
    if (state.timeOfDay !== null) count++;
    return count;
  },
};

export function useFilterStore<T>(selector: (store: FilterStore) => T): T {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    // Filters are session-only; the server always renders the defaults.
    () => DEFAULT_FILTER_STATE,
  );
  return selector({ ...current, ...actions });
}
