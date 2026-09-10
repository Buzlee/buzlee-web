"use client";

import { MapPin, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADDRESS_SEARCH_MIN_QUERY_LENGTH,
  composeAddressWithUnit,
  type GeocodedLocation,
  geocodedLocationFromSuggestion,
  useAddressSearch,
  WESTCHESTER_ADDRESS_SEARCH_PLACEHOLDER,
} from "@/entities/location";
import { cn } from "@/lib/utils";

/**
 * Web counterpart of buzlee-app's AddressEntryField: Geoapify autocomplete
 * (via the geocode-autocomplete edge function, Westchester-only), a picked
 * address with an apt/suite/unit input, and a clear action. Emits the same
 * `GeocodedLocation` shape the app persists, so `location` (map pin) and
 * `address` stay in sync across both clients.
 */
export function AddressField({
  id,
  value,
  onChange,
  disabled = false,
  /** Legacy rows may carry an `address` string with no geocoded `location`. */
  fallbackAddress,
}: {
  id: string;
  value: GeocodedLocation | null;
  onChange: (location: GeocodedLocation | null) => void;
  disabled?: boolean;
  fallbackAddress?: string | null;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const searching = value === null;
  const {
    data: suggestions = [],
    isFetching,
    error,
  } = useAddressSearch(query, searching);

  const ready = query.trim().length >= ADDRESS_SEARCH_MIN_QUERY_LENGTH;
  const showList = open && searching && ready;

  // Close on outside click.
  useEffect(() => {
    if (!showList) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  // Reset keyboard cursor when the result set changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on the suggestion list identity
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  function pick(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    onChange(geocodedLocationFromSuggestion(suggestion));
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(activeIndex);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  if (value) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm text-foreground">
              {composeAddressWithUnit(value.formatted_address, value.unit)}
            </span>
            <span className="text-xs text-muted-foreground">
              {value.town_name ? `${value.town_name} · ` : ""}
              Map pin set
            </span>
          </div>
          <Button
            aria-label="Remove address"
            disabled={disabled}
            onClick={() => onChange(null)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </div>
        <Input
          aria-label="Apt, suite, or unit"
          autoComplete="off"
          disabled={disabled}
          id={`${id}-unit`}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({ ...value, unit: raw.trim() ? raw : undefined });
          }}
          placeholder="Apt, suite, or unit (optional)"
          value={value.unit ?? ""}
        />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-1.5" ref={rootRef}>
      <Input
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showList}
        autoComplete="off"
        disabled={disabled}
        id={id}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={WESTCHESTER_ADDRESS_SEARCH_PLACEHOLDER}
        role="combobox"
        value={query}
      />
      {fallbackAddress ? (
        <p className="text-xs text-muted-foreground">
          Current address: {fallbackAddress} (no map pin — pick an address to
          set one)
        </p>
      ) : null}
      {showList ? (
        <div
          className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md"
          id={listId}
          role="listbox"
        >
          {error ? (
            <p className="px-3 py-2 text-sm text-destructive">
              Address search failed: {error.message}
            </p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {isFetching ? "Searching…" : "No Westchester addresses found."}
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id}>
                  <button
                    aria-selected={index === activeIndex}
                    className={cn(
                      "flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary",
                      index === activeIndex && "bg-secondary",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {suggestion.place_name}
                      </span>
                      {suggestion.town_name ? (
                        <span className="block text-xs text-muted-foreground">
                          {suggestion.town_name}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
