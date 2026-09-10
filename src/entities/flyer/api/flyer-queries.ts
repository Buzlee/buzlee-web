// PORTED FROM buzlee-app/src/entities/flyer/api/flyer-queries.ts — keep in sync; see docs/admin-sync.md
// Web trim: only what the admin flyer wizard needs (detail read, RPC upsert,
// update/delete, media + cover upload/delete). Discovery/list queries are
// resident-side and not ported. Uploads take a `Blob` (the app reads a
// file:// uri through expo-file-system); bucket, path and content type match.
import { supabase } from "@/shared/lib/supabase";
import type {
  Flyer,
  FlyerEvent,
  FlyerUpdate,
  FlyerWithDetails,
  UpsertFlyerWithEventsInput,
} from "../model/types";

/**
 * Relations every "flyer with details" query embeds. Shared with the
 * saved-flyers query so the two never drift (forgetting `flyer_events` there
 * would silently make Saved render summary-only data).
 */
export const FLYER_DETAILS_RELATIONS_SELECT = `
  business:businesses(id, name, logo_url, cover_photo_url, phone, email, show_email, website, address, social_links),
  category:flyer_categories(id, name, slug),
  town:towns(id, name),
  flyer_events(*)
`;

/**
 * Standard query string for fetching flyer with all related data
 */
const FLYER_WITH_DETAILS_SELECT = `
  *,
  ${FLYER_DETAILS_RELATIONS_SELECT},
  flyer_tags(tag:tags(id, name, slug))
`;

/**
 * Embedded `flyer_events(*)` come back unordered; the app relies on
 * sort_order (then start) everywhere (lineup, sheet list, "first event").
 */
export function normalizeFlyerEvents(
  rows: FlyerEvent[] | null | undefined,
): FlyerEvent[] {
  if (!rows || rows.length === 0) return [];
  return [...rows].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.starts_at.localeCompare(b.starts_at);
  });
}

// Web fix: the app's transform reads the joined row through `as any`; the
// web repo lints `noExplicitAny`, so the embedded shape is typed here.
type FlyerTagJoin = {
  tag: NonNullable<FlyerWithDetails["tags"]>[number] | null;
};
type FlyerDetailsRow = Omit<FlyerWithDetails, "tags" | "events"> & {
  flyer_tags?: FlyerTagJoin[] | null;
  flyer_events?: FlyerEvent[] | null;
  events?: FlyerEvent[] | null;
};

/**
 * Transform flyer data to extract tags from nested flyer_tags and order events
 */
function transformFlyerWithTags(flyer: FlyerDetailsRow): FlyerWithDetails {
  const { flyer_tags, flyer_events, ...rest } = flyer;
  return {
    ...rest,
    tags: (flyer_tags ?? [])
      .map((ft) => ft.tag)
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
    // `events` may already be present when re-transforming a normalized row.
    events: normalizeFlyerEvents(flyer_events ?? rest.events),
  };
}

/**
 * Fetch single flyer by ID
 */
export async function fetchFlyer(id: string): Promise<FlyerWithDetails> {
  const { data, error } = await supabase
    .from("flyers")
    .select(FLYER_WITH_DETAILS_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return transformFlyerWithTags(data as unknown as FlyerDetailsRow);
}

/**
 * Create or update a flyer together with its events in one transaction.
 * Backed by the `upsert_flyer_with_events` RPC: id-preserving event replace,
 * summary columns recomputed once, at most one change notification per save.
 * Pass `flyer.id` to update; omit it to create. Returns the fresh flyer row
 * (summary columns already derived).
 */
export async function upsertFlyerWithEvents(
  input: UpsertFlyerWithEventsInput,
): Promise<Flyer> {
  const { data, error } = await supabase.rpc("upsert_flyer_with_events", {
    p_flyer: input.flyer as never,
    p_events: input.events as never,
  });

  if (error) throw error;
  return data as Flyer;
}

/**
 * Update flyer
 */
export async function updateFlyer(
  id: string,
  updates: FlyerUpdate,
): Promise<Flyer> {
  const { data, error } = await supabase
    .from("flyers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete flyer
 * Business owners can delete their own flyers (except live ones)
 * Admins can delete any flyer
 */
export async function deleteFlyer(flyerId: string): Promise<void> {
  // First, get the flyer to clean up media
  const { data: flyer } = await supabase
    .from("flyers")
    .select("media_url, cover_photo_url, status, business_id")
    .eq("id", flyerId)
    .single();

  // Delete the flyer record (RLS will enforce permissions)
  const { error, count } = await supabase
    .from("flyers")
    .delete({ count: "exact" })
    .eq("id", flyerId);

  if (error) throw error;

  if (count === 0) {
    console.warn(
      "[deleteFlyer] No rows deleted — RLS may have blocked the delete for flyer:",
      flyerId,
    );
  }

  // Clean up media files after successful deletion
  if (flyer?.media_url) {
    await deleteFlyerMedia(flyer.media_url);
  }
  if (flyer?.cover_photo_url) {
    await deleteFlyerCoverPhoto(flyer.cover_photo_url);
  }

  // Clean up any orphaned files in the flyer's folder
  await cleanupOrphanedFlyerMedia(flyerId, null, null);
}

/**
 * Upload flyer media (image or PDF)
 * @param flyerId - The flyer ID to associate the media with
 * @param file - The prepared file body (JPEG blob or the PDF itself)
 * @param mediaType - The type of media (image or pdf)
 * @param existingUrl - Optional existing media URL to delete before uploading new file
 * @returns Public URL of the uploaded file
 */
export async function uploadFlyerMedia(
  flyerId: string,
  file: Blob,
  mediaType: "image" | "pdf",
  existingUrl?: string | null,
): Promise<string> {
  const ext = mediaType === "pdf" ? "pdf" : "jpg";
  const fileName = `${flyerId}/${Date.now()}.${ext}`;
  const contentType = mediaType === "pdf" ? "application/pdf" : "image/jpeg";

  const { data, error } = await supabase.storage
    .from("flyer-media")
    .upload(fileName, file, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[uploadFlyerMedia] Upload error:", error);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("flyer-media").getPublicUrl(data.path);

  if (existingUrl) {
    await deleteFlyerMedia(existingUrl);
  }

  return publicUrl;
}

/**
 * Upload flyer cover photo
 * @param flyerId - The flyer ID to associate the cover photo with
 * @param file - The prepared JPEG blob
 * @param existingUrl - Optional existing cover photo URL to delete before uploading new file
 * @returns Public URL of the uploaded file
 */
export async function uploadFlyerCoverPhoto(
  flyerId: string,
  file: Blob,
  existingUrl?: string | null,
): Promise<string> {
  const fileName = `${flyerId}/cover-${Date.now()}.jpg`;
  const contentType = "image/jpeg";

  const { data, error } = await supabase.storage
    .from("flyer-media")
    .upload(fileName, file, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[uploadFlyerCoverPhoto] Upload error:", error);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("flyer-media").getPublicUrl(data.path);

  if (existingUrl) {
    await deleteFlyerCoverPhoto(existingUrl);
  }

  return publicUrl;
}

/**
 * Delete flyer media from storage
 * @param mediaUrl - The public URL of the media to delete
 */
export async function deleteFlyerMedia(mediaUrl: string): Promise<void> {
  const cleanUrl = mediaUrl.split("?")[0];
  const urlParts = cleanUrl.split("/flyer-media/");

  if (urlParts.length < 2) {
    console.warn("[deleteFlyerMedia] Invalid media URL format:", mediaUrl);
    return;
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from("flyer-media")
    .remove([filePath]);

  if (error) {
    console.error("[deleteFlyerMedia] Error deleting file:", error);
  }
}

/**
 * Delete flyer cover photo from storage
 * @param coverPhotoUrl - The public URL of the cover photo to delete
 */
export async function deleteFlyerCoverPhoto(
  coverPhotoUrl: string,
): Promise<void> {
  const cleanUrl = coverPhotoUrl.split("?")[0];
  const urlParts = cleanUrl.split("/flyer-media/");

  if (urlParts.length < 2) {
    console.warn(
      "[deleteFlyerCoverPhoto] Invalid cover photo URL format:",
      coverPhotoUrl,
    );
    return;
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from("flyer-media")
    .remove([filePath]);

  if (error) {
    console.error("[deleteFlyerCoverPhoto] Error deleting file:", error);
  }
}

/**
 * Clean up orphaned flyer media files for a flyer
 * Deletes all media files in the flyer's folder except the current media and cover photo
 * @param flyerId - The flyer ID
 * @param currentMediaUrl - The current media URL to keep (optional)
 * @param currentCoverPhotoUrl - The current cover photo URL to keep (optional)
 */
export async function cleanupOrphanedFlyerMedia(
  flyerId: string,
  currentMediaUrl?: string | null,
  currentCoverPhotoUrl?: string | null,
): Promise<{ deleted: number; errors: number }> {
  const { data: files, error: listError } = await supabase.storage
    .from("flyer-media")
    .list(flyerId);

  if (listError) {
    console.error(
      "[cleanupOrphanedFlyerMedia] Error listing files:",
      listError,
    );
    throw listError;
  }

  if (!files || files.length === 0) {
    return { deleted: 0, errors: 0 };
  }

  const filesToKeep: string[] = [];

  if (currentMediaUrl) {
    const cleanUrl = currentMediaUrl.split("?")[0];
    const urlParts = cleanUrl.split(`${flyerId}/`);
    if (urlParts.length >= 2) {
      filesToKeep.push(urlParts[1]);
    }
  }

  if (currentCoverPhotoUrl) {
    const cleanUrl = currentCoverPhotoUrl.split("?")[0];
    const urlParts = cleanUrl.split(`${flyerId}/`);
    if (urlParts.length >= 2) {
      filesToKeep.push(urlParts[1]);
    }
  }

  const filesToDelete = files
    .filter((file) => !filesToKeep.includes(file.name))
    .map((file) => `${flyerId}/${file.name}`);

  if (filesToDelete.length === 0) {
    return { deleted: 0, errors: 0 };
  }

  const { data, error } = await supabase.storage
    .from("flyer-media")
    .remove(filesToDelete);

  if (error) {
    console.error("[cleanupOrphanedFlyerMedia] Error deleting files:", error);
    return { deleted: 0, errors: filesToDelete.length };
  }

  return {
    deleted: data?.length || 0,
    errors: filesToDelete.length - (data?.length || 0),
  };
}
