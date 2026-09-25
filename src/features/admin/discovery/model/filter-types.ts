// PORTED FROM buzlee-app/src/features/filter/model/types.ts — keep in sync; see docs/admin-sync.md
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type DatePreset = "all" | "today" | "this_week" | "this_month";

export interface FilterState {
  selectedTagIds: string[];
  selectedCategoryIds: string[];
  selectedTownIds: string[];
  datePreset: DatePreset;
  dateRange: {
    from: string | null;
    to: string | null;
  };
  timeOfDay: TimeOfDay | null;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  selectedTagIds: [],
  selectedCategoryIds: [],
  selectedTownIds: [],
  datePreset: "all",
  dateRange: { from: null, to: null },
  timeOfDay: null,
};

/** Chips shown in the filter sheet (`'all'` is the default when none selected). */
export const DATE_PRESETS: readonly {
  value: Exclude<DatePreset, "all">;
  label: string;
}[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
] as const;

export const TIME_OF_DAY_OPTIONS: readonly {
  value: TimeOfDay;
  label: string;
}[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
] as const;
