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
