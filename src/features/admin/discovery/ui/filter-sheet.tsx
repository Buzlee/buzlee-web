"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTags, useTowns } from "@/entities/catalog/api/use-catalog";
import { SearchInput } from "@/features/admin/components/search-input";
import { ChoiceChips } from "@/features/admin/flyer-wizard/ui/components/choice-chips";
import type { TagFacet } from "../lib/tag-facets";
import { DATE_PRESETS, TIME_OF_DAY_OPTIONS } from "../model/filter-types";
import { useFilterStore } from "../model/use-filter-state";

const VISIBLE_TAG_COUNT = 8;
const VISIBLE_TOWN_COUNT = 6;
const ALL = "__all__";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Multi-select chip list with the app's "pin selected to the top, then show
 * N with a `+n more` toggle" behaviour, plus an optional search box.
 */
function ChipPicker({
  items,
  selectedIds,
  onToggle,
  visibleCount,
  search,
  onSearch,
  searchPlaceholder,
  leading,
  labelPrefix = "",
}: {
  /** `count` is shown after the name when present (tag facets). */
  items: { id: string; name: string; count?: number }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  visibleCount: number;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  leading?: React.ReactNode;
  labelPrefix?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? items.filter((item) => item.name.toLowerCase().includes(q))
      : items;
    const selected = filtered.filter((item) => selectedIds.includes(item.id));
    const unselected = filtered.filter(
      (item) => !selectedIds.includes(item.id),
    );
    return [...selected, ...unselected];
  }, [items, search, selectedIds]);

  const visible = expanded || search ? sorted : sorted.slice(0, visibleCount);
  const hiddenCount = sorted.length - visibleCount;

  return (
    <div className="flex flex-col gap-3">
      {items.length > visibleCount ? (
        <SearchInput
          onChange={onSearch}
          placeholder={searchPlaceholder}
          value={search}
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {leading}
        <ChoiceChips
          multiple
          onChange={(next) => {
            const changed =
              next.find((id) => !selectedIds.includes(id)) ??
              selectedIds.find((id) => !next.includes(id));
            if (changed) onToggle(changed);
          }}
          options={visible.map((item) => ({
            value: item.id,
            label:
              item.count === undefined
                ? `${labelPrefix}${item.name}`
                : `${labelPrefix}${item.name} · ${item.count}`,
          }))}
          value={selectedIds}
        />
        {!search && hiddenCount > 0 ? (
          <button
            className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onClick={() => setExpanded((open) => !open)}
            type="button"
          >
            {expanded ? "Show less" : `+${hiddenCount} more`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Web port of the app's `FilterSheet` (tags, date preset / specific date,
 * time of day, towns) backed by the same filter store. Category is a
 * single-select row on the screen header, as in the app's `ResidentHeader`.
 */
export function FilterSheet({
  open,
  onOpenChange,
  tagFacets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tags on the screen's flyers (every filter but tags applied), from `useTagFacetedFlyers`. */
  tagFacets: TagFacet[];
}) {
  const [tagSearch, setTagSearch] = useState("");
  const [townSearch, setTownSearch] = useState("");
  const { data: allTags = [] } = useTags();
  const { data: towns = [] } = useTowns();

  const selectedTagIds = useFilterStore((s) => s.selectedTagIds);
  const selectedTownIds = useFilterStore((s) => s.selectedTownIds);
  const datePreset = useFilterStore((s) => s.datePreset);
  const dateRange = useFilterStore((s) => s.dateRange);
  const timeOfDay = useFilterStore((s) => s.timeOfDay);
  const toggleTagId = useFilterStore((s) => s.toggleTagId);
  const toggleTownId = useFilterStore((s) => s.toggleTownId);
  const setTownIds = useFilterStore((s) => s.setTownIds);
  const setDatePreset = useFilterStore((s) => s.setDatePreset);
  const setDateRange = useFilterStore((s) => s.setDateRange);
  const setTimeOfDay = useFilterStore((s) => s.setTimeOfDay);
  const clearAll = useFilterStore((s) => s.clearAll);
  const hasActiveFilters = useFilterStore((s) => s.hasActiveFilters);

  const specificDate = dateRange.from ? dateRange.from.slice(0, 10) : "";

  // Only tags on the flyers this screen shows. A selected tag that no longer
  // matches anything stays listed with a zero count so it can be turned off.
  const tagOptions = useMemo(() => {
    const offered = new Set(tagFacets.map((facet) => facet.id));
    const stale: TagFacet[] = selectedTagIds
      .filter((id) => !offered.has(id))
      .map((id) => ({
        id,
        name: allTags.find((t) => t.id === id)?.name ?? "",
        count: 0,
      }))
      .filter((facet) => facet.name);
    return [...stale, ...tagFacets];
  }, [tagFacets, selectedTagIds, allTags]);

  function handleClearAll() {
    clearAll();
    setTagSearch("");
    setTownSearch("");
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-[440px]">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Filter by</SheetTitle>
          <SheetDescription>
            The same filters residents use in the app.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
          <Section title="Tags">
            {tagOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags on the events that match your filters.
              </p>
            ) : null}
            <ChipPicker
              items={tagOptions}
              labelPrefix="#"
              onSearch={setTagSearch}
              onToggle={toggleTagId}
              search={tagSearch}
              searchPlaceholder="Search tags"
              selectedIds={selectedTagIds}
              visibleCount={VISIBLE_TAG_COUNT}
            />
          </Section>

          <Section title="Date">
            <ChoiceChips
              onChange={(next) =>
                setDatePreset(next === datePreset ? "all" : next)
              }
              options={DATE_PRESETS.map((preset) => ({
                value: preset.value,
                label: preset.label,
              }))}
              value={datePreset === "all" ? null : datePreset}
            />
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="discovery-filter-date"
              >
                Specific date
              </label>
              <DatePicker
                clearable
                id="discovery-filter-date"
                onChange={(d) => {
                  if (d) setDateRange(`${d}T00:00:00`, `${d}T23:59:59`);
                  else setDateRange(null, null);
                }}
                placeholder="Any date"
                value={specificDate}
              />
            </div>
          </Section>

          <Section title="Time of day">
            <ChoiceChips
              onChange={(next) =>
                setTimeOfDay(next === timeOfDay ? null : next)
              }
              options={TIME_OF_DAY_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={timeOfDay}
            />
          </Section>

          {towns.length > 0 ? (
            <Section title="Town">
              <ChipPicker
                items={towns}
                leading={
                  <ChoiceChips
                    onChange={() => setTownIds([])}
                    options={[{ value: ALL, label: "All" }]}
                    value={selectedTownIds.length === 0 ? ALL : null}
                  />
                }
                onSearch={setTownSearch}
                onToggle={toggleTownId}
                search={townSearch}
                searchPlaceholder="Search towns"
                selectedIds={selectedTownIds}
                visibleCount={VISIBLE_TOWN_COUNT}
              />
            </Section>
          ) : null}
        </div>

        <SheetFooter className="flex-row justify-between border-t border-border">
          <Button
            disabled={!hasActiveFilters()}
            onClick={handleClearAll}
            type="button"
            variant="ghost"
          >
            Clear all
          </Button>
          <Button
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
