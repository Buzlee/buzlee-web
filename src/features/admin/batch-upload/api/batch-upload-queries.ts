// PORTED FROM buzlee-app/src/features/admin-batch-upload/api/batch-upload-queries.ts — keep in sync; see docs/admin-sync.md
import { createUnclaimedBusiness } from "@/entities/admin";
import type { Business } from "@/entities/business/model/types";
import { upsertFlyerWithEvents } from "@/entities/flyer/api/flyer-queries";
import { combineDateAndTime } from "@/entities/flyer/lib/flyer-datetime";
import type { Flyer, FlyerRpcInput } from "@/entities/flyer/model/types";
import { supabase } from "@/shared/lib/supabase";
import type { BusinessRow, FlyerRow } from "../lib/batch-row-schemas";
import { fetchRemoteMedia } from "../lib/remote-media";

/**
 * All inserts in this module run through the standard authenticated client,
 * so RLS enforces them: `flyers_insert_admin` (admin + approved business),
 * `businesses_insert_own_or_admin`, and the flyer-media storage policies.
 * No service-role key is involved anywhere in the batch upload flow.
 */

export interface ReferenceData {
  /** Lowercased business name → matching businesses (name is not unique). */
  businessesByName: Map<string, { id: string; status: string }[]>;
  flyerCategoriesByName: Map<string, string>;
  businessCategoriesByName: Map<string, string>;
  townsByName: Map<string, string>;
  tagsByName: Map<string, string>;
}

export async function fetchReferenceData(): Promise<ReferenceData> {
  const [businesses, flyerCategories, businessCategories, towns, tags] =
    await Promise.all([
      supabase.from("businesses").select("id, name, status"),
      supabase.from("flyer_categories").select("id, name"),
      supabase.from("business_categories").select("id, name"),
      supabase.from("towns").select("id, name"),
      supabase.from("tags").select("id, name"),
    ]);

  for (const result of [
    businesses,
    flyerCategories,
    businessCategories,
    towns,
    tags,
  ]) {
    if (result.error) throw result.error;
  }

  const businessesByName = new Map<string, { id: string; status: string }[]>();
  for (const b of businesses.data ?? []) {
    const key = b.name.trim().toLowerCase();
    const list = businessesByName.get(key) ?? [];
    list.push({ id: b.id, status: b.status });
    businessesByName.set(key, list);
  }

  const toNameMap = (items: { id: string; name: string }[] | null) =>
    new Map(
      (items ?? []).map((item) => [item.name.trim().toLowerCase(), item.id]),
    );

  return {
    businessesByName,
    flyerCategoriesByName: toNameMap(flyerCategories.data),
    businessCategoriesByName: toNameMap(businessCategories.data),
    townsByName: toNameMap(towns.data),
    tagsByName: toNameMap(tags.data),
  };
}

/**
 * Existing flyer identity keys for duplicate detection, so re-running a
 * partially failed batch skips rows that already made it into the database.
 */
export async function fetchExistingFlyerKeys(
  businessIds: string[],
): Promise<Set<string>> {
  if (businessIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("flyers")
    .select("business_id, title, event_date")
    .in("business_id", businessIds);

  if (error) throw error;

  return new Set(
    (data ?? []).map((f) =>
      flyerDuplicateKey(f.business_id, f.title, f.event_date),
    ),
  );
}

export function flyerDuplicateKey(
  businessId: string,
  title: string,
  eventDate: string,
): string {
  return `${businessId}|${title.trim().toLowerCase()}|${eventDate.split("T")[0]}`;
}

export interface ResolvedFlyerRow {
  row: FlyerRow;
  rowNumber: number;
  businessId: string;
  categoryId: string;
  townId: string | null;
  tagIds: string[];
  warnings: string[];
}

export interface ResolvedBusinessRow {
  row: BusinessRow;
  rowNumber: number;
  categoryId: string;
  townId: string | null;
  warnings: string[];
}

function buildLocationJson(
  row: { latitude?: number; longitude?: number; town?: string },
  address: string,
) {
  if (row.latitude === undefined || row.longitude === undefined) return null;
  return {
    lat: row.latitude,
    lng: row.longitude,
    formatted_address: address,
    town_name: row.town ?? null,
    provider: "admin-batch-upload",
  };
}

async function uploadToFlyerMedia(
  path: string,
  arrayBuffer: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("flyer-media")
    .upload(path, arrayBuffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("flyer-media").getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Create one flyer from a resolved batch row:
 * download media → insert flyer → upload media into flyer-media → attach URLs → tags.
 * If a step after the insert fails, the flyer row is deleted so no broken
 * flyer (missing media) is left visible in feeds.
 */
export async function uploadFlyerRow(
  resolved: ResolvedFlyerRow,
): Promise<Flyer> {
  const { row, businessId, categoryId, townId, tagIds } = resolved;

  // Download media up front so an unreachable URL fails before any insert
  const media = await fetchRemoteMedia(row.media_url);
  const cover = row.cover_photo_url
    ? await fetchRemoteMedia(row.cover_photo_url)
    : null;
  if (cover && cover.mediaType !== "image") {
    throw new Error("cover_photo_url must point to an image");
  }

  const eventDateTime = combineDateAndTime(row.event_date, row.event_time);
  const eventEndDateTime = row.event_end_date
    ? combineDateAndTime(row.event_end_date, row.event_end_time)
    : null;
  const isLive = row.status === "live";

  // Batch rows are single-event flyers. The RPC writes the flyer and its one
  // event atomically; expires_at and the schedule summary columns are derived
  // in the DB from the event.
  const flyerInput: FlyerRpcInput = {
    business_id: businessId,
    title: row.title,
    description: row.description ?? null,
    category_id: categoryId,
    location_name: row.location_name ?? null,
    location_address: row.location_address,
    location: buildLocationJson(row, row.location_address),
    town_id: townId,
    external_link: row.external_link ?? null,
    age_min_months: row.age_restriction?.minMonths ?? null,
    age_max_months: row.age_restriction?.maxMonths ?? null,
    status: row.status,
    visibility: row.visibility,
    live_at: isLive ? new Date().toISOString() : null,
    media_url: "",
    media_type: media.mediaType,
    flyer_type: "single",
  };

  const flyer = await upsertFlyerWithEvents({
    flyer: flyerInput,
    events: [
      {
        title: row.title,
        description: null,
        starts_at: eventDateTime,
        ends_at: eventEndDateTime,
        recurrence_rule: null,
        recurrence_until: null,
        sort_order: 0,
      },
    ],
  });

  const uploadedPaths: string[] = [];

  try {
    const mediaPath = `${flyer.id}/${Date.now()}.${media.ext}`;
    const mediaUrl = await uploadToFlyerMedia(
      mediaPath,
      media.arrayBuffer,
      media.contentType,
    );
    uploadedPaths.push(mediaPath);

    let coverPhotoUrl: string | null = null;
    if (cover) {
      const coverPath = `${flyer.id}/cover-${Date.now()}.${cover.ext}`;
      coverPhotoUrl = await uploadToFlyerMedia(
        coverPath,
        cover.arrayBuffer,
        cover.contentType,
      );
      uploadedPaths.push(coverPath);
    }

    const { data: updated, error: updateError } = await supabase
      .from("flyers")
      .update({ media_url: mediaUrl, cover_photo_url: coverPhotoUrl })
      .eq("id", flyer.id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (tagIds.length > 0) {
      const { error: tagsError } = await supabase
        .from("flyer_tags")
        .insert(tagIds.map((tagId) => ({ flyer_id: flyer.id, tag_id: tagId })));
      if (tagsError) throw tagsError;
    }

    return updated;
  } catch (error) {
    // Best-effort rollback so no half-created flyer or orphaned media remains
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("flyer-media").remove(uploadedPaths);
    }
    await supabase.from("flyers").delete().eq("id", flyer.id);
    throw error;
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Case-insensitive exact-name lookup, used to re-check existence at upload time. */
export async function businessExistsByName(name: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .ilike("name", escapeLikePattern(name.trim()))
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

/**
 * Create one business from a resolved batch row via the same
 * `createUnclaimedBusiness` path as the admin "Create Business" screen
 * (unclaimed, pre-approved listing). Existence is re-checked against the
 * database immediately before inserting — business names are not unique in
 * the schema, so this is the only guard against creating a duplicate when
 * the validation snapshot has gone stale. Returns null if the business
 * already exists (caller reports the row as skipped).
 */
export async function createBusinessRow(
  resolved: ResolvedBusinessRow,
  adminId: string,
): Promise<Business | null> {
  const { row, categoryId, townId } = resolved;

  if (await businessExistsByName(row.name)) {
    return null;
  }

  return createUnclaimedBusiness(
    {
      name: row.name,
      email: row.email ?? null,
      categoryId,
      phone: row.phone ?? null,
      website: row.website ?? null,
      address: row.address ?? null,
      townId,
      location: buildLocationJson(row, row.address ?? row.name),
      description: row.description ?? null,
    },
    adminId,
  );
}
