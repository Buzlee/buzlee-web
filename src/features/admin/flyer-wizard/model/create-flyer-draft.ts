// PORTED FROM buzlee-app/src/features/flyer-wizard/model/create-flyer-draft.ts — keep in sync; see docs/admin-sync.md

import {
  getFlyerAgeRange,
  monthsToAgeInput,
} from "@/entities/flyer/lib/age-restriction";
import {
  getRecurrencePresetFromRule,
  getWeeklyRecurrenceDaysFromRule,
} from "@/entities/flyer/lib/flyer-recurrence";
import type {
  FlyerEvent,
  FlyerWithDetails,
} from "@/entities/flyer/model/types";
import type { GeocodedLocation } from "@/entities/location";
import { createLocalId } from "../lib/local-id";
import type {
  AgeRestrictionDraft,
  CoverPhotoDraft,
  EventDraft,
  FlyerDraft,
  FlyerMediaDraft,
  FlyerType,
} from "./types";

export const EMPTY_AGE_RESTRICTION: AgeRestrictionDraft = {
  enabled: false,
  min: "",
  minUnit: "years",
  max: "",
  maxUnit: "years",
};

export function createEmptyEventDraft(
  partial: Partial<EventDraft> = {},
): EventDraft {
  return {
    localId: createLocalId(),
    serverId: null,
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    recurrence: "none",
    weeklyDays: [],
    recurrenceUntil: "",
    ...partial,
  };
}

export function createEmptyFlyerDraft(
  flyerType: FlyerType = "single",
): FlyerDraft {
  return {
    flyerType,
    title: "",
    media: null,
    mediaChanged: false,
    coverPhoto: null,
    coverPhotoChanged: false,
    events: flyerType === "single" ? [createEmptyEventDraft()] : [],
    description: "",
    categoryId: "",
    tagIds: [],
    ageRestriction: { ...EMPTY_AGE_RESTRICTION },
    location: null,
    locationName: "",
    externalLink: "",
    visibility: "public",
  };
}

/** `YYYY-MM-DDTHH:mm…` (any offset) → { date, time }; a midnight time part reads as '' (all-day). */
function splitTimestamp(timestamp: string): { date: string; time: string } {
  const [date, rest] = timestamp.split("T");
  const time = rest?.substring(0, 5) ?? "";
  return { date: date ?? "", time: time === "00:00" ? "" : time };
}

type ScheduleSource = Pick<
  FlyerEvent,
  "starts_at" | "ends_at" | "recurrence_rule"
> & {
  recurrence_until?: string | null;
};

function scheduleFieldsFromRow(
  row: ScheduleSource,
): Pick<
  EventDraft,
  | "startDate"
  | "startTime"
  | "endDate"
  | "endTime"
  | "recurrence"
  | "weeklyDays"
  | "recurrenceUntil"
> {
  const { date: startDate, time: startTime } = splitTimestamp(row.starts_at);

  let endDate = "";
  let endTime = "";
  if (row.ends_at) {
    const end = splitTimestamp(row.ends_at);
    // A same-day end with an explicit time was entered as "end time only"
    // (resolveEventEnd defaults the end date to the start date), so hydrate
    // it back that way instead of showing a redundant end date.
    const isSameDayTimedEnd = !!end.time && end.date === startDate;
    endDate = isSameDayTimedEnd ? "" : end.date;
    endTime = end.time;
  }

  return {
    startDate,
    startTime,
    endDate,
    endTime,
    recurrence: getRecurrencePresetFromRule(row.recurrence_rule),
    weeklyDays: getWeeklyRecurrenceDaysFromRule(
      row.recurrence_rule,
      row.starts_at,
    ),
    recurrenceUntil: row.recurrence_until ?? "",
  };
}

export function eventDraftFromFlyerEvent(event: FlyerEvent): EventDraft {
  return {
    localId: createLocalId(),
    serverId: event.id,
    title: event.title ?? "",
    description: event.description ?? "",
    ...scheduleFieldsFromRow(event),
    checkInCount: event.check_in_count ?? 0,
  };
}

/** Legacy rows fetched without `flyer_events`: synthesize the one event from the summary columns. */
function legacyEventFromFlyer(flyer: FlyerWithDetails): EventDraft {
  return createEmptyEventDraft({
    title: flyer.title ?? "",
    ...scheduleFieldsFromRow({
      starts_at: flyer.event_date,
      ends_at: flyer.event_end_date,
      recurrence_rule: flyer.recurrence_rule,
      recurrence_until: null,
    }),
    checkInCount: flyer.check_in_count ?? 0,
  });
}

function sortEvents(events: FlyerEvent[]): FlyerEvent[] {
  return [...events].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.starts_at.localeCompare(b.starts_at),
  );
}

type StoredLocation = {
  lat?: unknown;
  lng?: unknown;
  formatted_address?: unknown;
  unit?: unknown;
  town_name?: unknown;
  provider?: unknown;
};

/**
 * Same logic as the old form hydration: lenient (no bounds check) and falls
 * back to `location_address` when the JSON has no formatted_address.
 */
function locationFromFlyer(
  flyer: Pick<FlyerWithDetails, "location" | "location_address">,
): GeocodedLocation | null {
  const stored = flyer.location as StoredLocation | null;
  if (!stored || typeof stored !== "object") return null;
  if (typeof stored.lat !== "number" || typeof stored.lng !== "number")
    return null;
  if (!stored.lat || !stored.lng) return null;

  const formatted =
    typeof stored.formatted_address === "string" &&
    stored.formatted_address.trim()
      ? stored.formatted_address
      : flyer.location_address;

  return {
    lat: stored.lat,
    lng: stored.lng,
    formatted_address: formatted,
    unit:
      typeof stored.unit === "string" && stored.unit.trim()
        ? stored.unit
        : undefined,
    town_name:
      typeof stored.town_name === "string" ? stored.town_name : undefined,
    // Preserve the stored provider; default legacy rows (no provider) to 'maptiler'.
    provider: stored.provider === "geoapify" ? "geoapify" : "maptiler",
  };
}

function ageRestrictionFromFlyer(flyer: FlyerWithDetails): AgeRestrictionDraft {
  const range = getFlyerAgeRange(flyer);
  if (!range) return { ...EMPTY_AGE_RESTRICTION };
  const min =
    range.minMonths != null ? monthsToAgeInput(range.minMonths) : null;
  const max =
    range.maxMonths != null ? monthsToAgeInput(range.maxMonths) : null;
  return {
    enabled: true,
    min: min ? String(min.value) : "",
    minUnit: min?.unit ?? "years",
    max: max ? String(max.value) : "",
    maxUnit: max?.unit ?? "years",
  };
}

/**
 * Hydrate an editable draft from a fetched flyer. Events come from
 * `flyer.events` (sorted by sort_order); legacy rows without events get one
 * synthesized from the summary columns.
 */
export function createDraftFromFlyer(
  flyer: FlyerWithDetails,
  tagIds: string[] = [],
): FlyerDraft {
  const rows = sortEvents(flyer.events ?? []);
  const events =
    rows.length > 0
      ? rows.map(eventDraftFromFlyerEvent)
      : [legacyEventFromFlyer(flyer)];

  const storedType: FlyerType | null =
    flyer.flyer_type === "multi" || flyer.flyer_type === "single"
      ? flyer.flyer_type
      : null;
  const inferredType: FlyerType = events.length > 1 ? "multi" : "single";
  // A "single" row that somehow carries several events is treated as multi so
  // hydration never silently drops events.
  const flyerType: FlyerType =
    storedType === "single" && events.length > 1
      ? "multi"
      : (storedType ?? inferredType);

  const media: FlyerMediaDraft | null = flyer.media_url
    ? {
        uri: flyer.media_url,
        type: flyer.media_type === "pdf" ? "pdf" : "image",
        name: "existing-media",
      }
    : null;
  const coverPhoto: CoverPhotoDraft | null = flyer.cover_photo_url
    ? { uri: flyer.cover_photo_url, name: "existing-cover-photo" }
    : null;

  return {
    flyerType,
    title: flyer.title ?? "",
    media,
    mediaChanged: false,
    coverPhoto,
    coverPhotoChanged: false,
    events,
    description: flyer.description ?? "",
    categoryId: flyer.category_id ?? "",
    tagIds,
    ageRestriction: ageRestrictionFromFlyer(flyer),
    location: locationFromFlyer(flyer),
    locationName: flyer.location_name ?? "",
    externalLink: flyer.external_link ?? "",
    visibility: flyer.visibility ?? "public",
  };
}

/** `create:<businessId>` for new flyers, `edit:<flyerId>` when editing. */
export function buildWizardSessionKey(
  businessId: string,
  flyerId?: string | null,
): string {
  return flyerId ? `edit:${flyerId}` : `create:${businessId}`;
}
