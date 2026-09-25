// PORTED FROM buzlee-app/src/features/flyer-wizard/lib/serialize-flyer-draft.ts — keep in sync; see docs/admin-sync.md
import { fetchTownByName } from "@/entities/catalog/api/catalog-queries";
import { combineDateAndTime } from "@/entities/flyer/lib/flyer-datetime";
import type { FlyerEventSchedule } from "@/entities/flyer/lib/flyer-helper";
import { getRecurrenceRuleFromPreset } from "@/entities/flyer/lib/flyer-recurrence";
import type {
  FlyerEventInput,
  FlyerRpcInput,
  UpsertFlyerWithEventsInput,
} from "@/entities/flyer/model/types";
import { composeAddressWithUnit } from "@/entities/location";
import type {
  AgeRestrictionDraft,
  EventDraft,
  FlyerDraft,
} from "../model/types";
import { parseAgeBoundMonths } from "./validate-wizard-step";

/**
 * `ends_at` for an event draft.
 * - End date set: that date, with the end time when set (else the midnight
 *   "date-only" sentinel meaning end of that day).
 * - End time only (no end date): a same-day event — the start date with the
 *   given time.
 * - Neither: null.
 */
export function resolveEventEnd(
  event: Pick<EventDraft, "startDate" | "endDate" | "endTime">,
): string | null {
  if (event.endDate) {
    return combineDateAndTime(event.endDate, event.endTime || "00:00");
  }
  if (event.endTime) {
    return combineDateAndTime(event.startDate, event.endTime);
  }
  return null;
}

/** Schedule columns of one flyer_events row from a draft (shared by display and save). */
export function eventDraftToSchedule(event: EventDraft): FlyerEventSchedule {
  return {
    starts_at: combineDateAndTime(event.startDate, event.startTime),
    ends_at: resolveEventEnd(event),
    recurrence_rule: getRecurrenceRuleFromPreset(
      event.recurrence,
      event.weeklyDays,
    ),
    recurrence_until:
      event.recurrence !== "none" && event.recurrenceUntil
        ? event.recurrenceUntil
        : null,
  };
}

/** Event rows for `upsert_flyer_with_events`. Single flyers mirror the flyer title onto their event. */
export function buildEventInputs(draft: FlyerDraft): FlyerEventInput[] {
  return draft.events.map((event, index) => {
    const input: FlyerEventInput = {
      ...eventDraftToSchedule(event),
      title: draft.flyerType === "single" ? draft.title : event.title,
      description: event.description.trim() ? event.description : null,
      sort_order: index,
    };
    if (event.serverId) input.id = event.serverId;
    return input;
  });
}

/**
 * Age range columns from the draft. Always clears the legacy years-based
 * age_restriction column so it can't shadow the range on previously saved rows.
 */
export function buildAgeRestrictionFields(age: AgeRestrictionDraft) {
  return {
    age_min_months: age.enabled
      ? parseAgeBoundMonths(age.min, age.minUnit)
      : null,
    age_max_months: age.enabled
      ? parseAgeBoundMonths(age.max, age.maxUnit)
      : null,
    age_restriction: null,
  };
}

export async function lookupTownId(townName?: string): Promise<string | null> {
  if (!townName) return null;
  try {
    const town = await fetchTownByName(townName);
    return town?.id || null;
  } catch (error) {
    console.warn("[FlyerWizard] Failed to look up town:", error);
    return null;
  }
}

export type SerializeContext = {
  businessId: string;
  status: "live" | "draft";
  mediaType: "image" | "pdf";
  /** Existing flyer id when editing. */
  id?: string;
  /** Edit of an already-live flyer: leave `live_at` untouched. */
  keepLiveAt?: boolean;
  /** Uploaded media URL; defaults to '' (the save flow patches it after upload). */
  mediaUrl?: string;
  /** Uploaded cover photo URL; omitted from the payload when undefined. */
  coverPhotoUrl?: string | null;
};

/**
 * Flyer columns for `upsert_flyer_with_events`. Schedule summary columns
 * (event_date / event_end_date / recurrence_rule / expires_at) are never set —
 * the DB derives them from the events.
 */
export async function buildFlyerFields(
  draft: FlyerDraft,
  ctx: SerializeContext,
): Promise<FlyerRpcInput> {
  const location = draft.location;
  if (!location) {
    throw new Error("A location is required to save a flyer");
  }

  const townId = await lookupTownId(location.town_name);

  const fields: FlyerRpcInput = {
    business_id: ctx.businessId,
    flyer_type: draft.flyerType,
    title: draft.title,
    description: draft.description.trim() ? draft.description : null,
    category_id: draft.categoryId,
    location_name: draft.locationName.trim() ? draft.locationName : null,
    location_address: composeAddressWithUnit(
      location.formatted_address,
      location.unit,
    ),
    location: {
      lat: location.lat,
      lng: location.lng,
      formatted_address: location.formatted_address,
      unit: location.unit,
      town_name: location.town_name,
      provider: location.provider,
    },
    town_id: townId,
    external_link: draft.externalLink.trim() ? draft.externalLink.trim() : null,
    ...buildAgeRestrictionFields(draft.ageRestriction),
    status: ctx.status,
    media_url: ctx.mediaUrl ?? "",
    media_type: ctx.mediaType,
    visibility: draft.visibility,
  };

  if (ctx.status === "live") {
    if (!ctx.keepLiveAt) fields.live_at = new Date().toISOString();
  } else {
    fields.live_at = null;
  }
  if (ctx.coverPhotoUrl !== undefined)
    fields.cover_photo_url = ctx.coverPhotoUrl;
  if (ctx.id) fields.id = ctx.id;

  return fields;
}

export async function buildUpsertInput(
  draft: FlyerDraft,
  ctx: SerializeContext,
): Promise<UpsertFlyerWithEventsInput> {
  return {
    flyer: await buildFlyerFields(draft, ctx),
    events: buildEventInputs(draft),
  };
}
