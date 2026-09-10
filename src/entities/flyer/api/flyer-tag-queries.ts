// PORTED FROM buzlee-app/src/entities/flyer/api/flyer-tag-queries.ts — keep in sync; see docs/admin-sync.md
// Web trim: read + replace only (the single add/remove and tag CRUD helpers are
// owner-side). `fetchFlyerTags` types the join instead of `as any`.
import type { Tag } from "@/entities/catalog/model/types";
import { supabase } from "@/shared/lib/supabase";

/**
 * Fetch tags for a specific flyer
 */
export async function fetchFlyerTags(flyerId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("flyer_tags")
    .select("tags(*)")
    .eq("flyer_id", flyerId);

  if (error) throw error;
  if (!data) return [];

  return data
    .map((item) => item.tags as Tag | null)
    .filter((tag): tag is Tag => tag !== null);
}

/**
 * Set tags for a flyer (replaces existing tags)
 */
export async function setFlyerTags(
  flyerId: string,
  tagIds: string[],
): Promise<void> {
  // Delete existing tags
  const { error: deleteError } = await supabase
    .from("flyer_tags")
    .delete()
    .eq("flyer_id", flyerId);

  if (deleteError) throw deleteError;

  // Insert new tags
  if (tagIds.length > 0) {
    const insertData = tagIds.map((tagId) => ({
      flyer_id: flyerId,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase
      .from("flyer_tags")
      .insert(insertData);

    if (insertError) throw insertError;
  }
}
