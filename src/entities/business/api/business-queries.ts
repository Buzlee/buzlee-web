// PORTED FROM buzlee-app/src/entities/business/api/business-queries.ts — keep in sync; see docs/admin-sync.md
// Web trim: only `fetchBusiness` and `updateBusiness` are ported (used by
// the admin edit form and useAdminUpdateBusiness). The rest of the
// buzlee-app original handles owner onboarding and media uploads via
// expo-file-system, which has no web equivalent here.
import { supabase } from "@/shared/lib/supabase";
import type {
  Business,
  BusinessUpdate,
  BusinessWithDetails,
} from "../model/types";

/**
 * Standard query string for fetching business with all related data
 */
const BUSINESS_WITH_DETAILS_SELECT = `
  *,
  category:business_categories(id, name, slug),
  town:towns(id, name)
`;

/**
 * Transform Supabase query result to BusinessWithDetails
 */
// biome-ignore lint/suspicious/noExplicitAny: mirrors buzlee-app original; joined shape is validated by the select string
function transformBusinessResult(data: any): BusinessWithDetails {
  return {
    ...data,
    profile: null, // Profile will be fetched separately when needed
  };
}

/**
 * Fetch single business by ID with full details
 */
export async function fetchBusiness(id: string): Promise<BusinessWithDetails> {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_DETAILS_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return transformBusinessResult(data);
}

/**
 * Update existing business
 */
export async function updateBusiness(
  id: string,
  updates: BusinessUpdate,
): Promise<Business> {
  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Storage helpers — WEB DEVIATION from buzlee-app.
//
// The app's uploadBusinessLogo / uploadBusinessCoverPhoto take an `ImageAsset`
// (expo-image-picker result) and read it via expo-file-system. On web the
// caller hands us a `Blob` (already cropped/resized to JPEG by
// features/admin/lib/image.ts), so the storage path, bucket, content type,
// and delete-after-upload semantics stay identical to the app.
// ---------------------------------------------------------------------------

const BUSINESS_ASSETS_BUCKET = "business-assets";

async function uploadBusinessAsset(
  businessId: string,
  kind: "logo" | "cover",
  image: Blob,
  existingUrl?: string | null,
): Promise<string> {
  // Unique file path: businessId/<kind>-timestamp.jpg (matches the app).
  const fileName = `${businessId}/${kind}-${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(fileName, image, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error(`[uploadBusinessAsset:${kind}] Upload error:`, error);
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(data.path);

  // Delete old asset AFTER successful upload.
  if (existingUrl) {
    await deleteBusinessAsset(existingUrl);
  }

  return publicUrl;
}

/**
 * Upload business logo to Supabase Storage.
 * @returns Public URL of the uploaded logo
 */
export function uploadBusinessLogo(
  businessId: string,
  image: Blob,
  existingUrl?: string | null,
): Promise<string> {
  return uploadBusinessAsset(businessId, "logo", image, existingUrl);
}

/**
 * Upload business cover photo to Supabase Storage.
 * @returns Public URL of the uploaded cover photo
 */
export function uploadBusinessCoverPhoto(
  businessId: string,
  image: Blob,
  existingUrl?: string | null,
): Promise<string> {
  return uploadBusinessAsset(businessId, "cover", image, existingUrl);
}

/**
 * Delete business asset (logo or cover photo) from storage.
 * Mirrors the app: never throws — a failed delete must not block the edit.
 */
export async function deleteBusinessAsset(assetUrl: string): Promise<void> {
  // Extract the file path from the public URL (drop cache-busting query).
  const cleanUrl = assetUrl.split("?")[0];
  const urlParts = cleanUrl.split(`/${BUSINESS_ASSETS_BUCKET}/`);

  if (urlParts.length < 2) {
    console.warn("[deleteBusinessAsset] Invalid asset URL format:", assetUrl);
    return;
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("[deleteBusinessAsset] Error deleting file:", error);
  }
}
