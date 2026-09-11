"use client";

import { useFlyerCategories } from "@/entities/catalog/api/use-catalog";
import { ChoiceChips } from "@/features/admin/flyer-wizard/ui/components/choice-chips";
import { useFilterStore } from "../model/use-filter-state";

const ALL = "__all__";

/**
 * Web port of the app's `CategoryFilter`: "All" plus one flyer category,
 * single-select (choosing the active category returns to All).
 */
export function CategoryChips() {
  const { data: categories = [] } = useFlyerCategories();
  const selectedCategoryIds = useFilterStore((s) => s.selectedCategoryIds);
  const setCategoryIds = useFilterStore((s) => s.setCategoryIds);

  const value = selectedCategoryIds[0] ?? ALL;

  return (
    <ChoiceChips
      aria-label="Category"
      onChange={(next) =>
        setCategoryIds(next === ALL || next === value ? [] : [next])
      }
      options={[
        { value: ALL, label: "All" },
        ...categories.map((category) => ({
          value: category.id,
          label: category.name,
        })),
      ]}
      value={value}
    />
  );
}
