// PORTED FROM buzlee-app/src/entities/business/api/business-queries.ts — keep in sync; see docs/admin-sync.md
// Web trim: only `updateBusiness` is ported (used by useAdminUpdateBusiness).
// The rest of the buzlee-app original handles owner onboarding and media
// uploads via expo-file-system, which has no web equivalent here.
import { supabase } from "@/shared/lib/supabase";
import type { Business, BusinessUpdate } from "../model/types";

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
