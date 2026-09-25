// PORTED FROM buzlee-app/src/entities/member/api/member-queries.ts — keep in sync; see docs/admin-sync.md
// Web trim: only the active-member count (flyer wizard "Members only" helper).
import { supabase } from "@/shared/lib/supabase";

export async function fetchActiveMemberCount(
  businessId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("get_business_member_count", {
    p_business_id: businessId,
  });

  if (error) throw error;
  return typeof data === "number" ? data : 0;
}
