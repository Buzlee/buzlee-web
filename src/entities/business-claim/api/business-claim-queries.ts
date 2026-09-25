// PORTED FROM buzlee-app/src/entities/business-claim/api/business-claim-queries.ts — keep in sync; see docs/admin-sync.md
import { supabase } from "@/shared/lib/supabase";
import { sendClaimApprovedEmail } from "../lib/send-claim-approved-email";
import type {
  BusinessClaim,
  BusinessClaimStatus,
  BusinessClaimTokenPreview,
  BusinessClaimWithBusiness,
  ClaimWithTokenInput,
  SubmitBusinessClaimInput,
  UnclaimedBusinessSummary,
} from "../model/types";

const CLAIM_WITH_BUSINESS_SELECT = `
  *,
  business:businesses(id, name, email, logo_url, status, user_id)
`;

/**
 * Submit a claim requesting ownership of an unclaimed business.
 * RLS enforces: claimant = current user, business is unclaimed, status = pending.
 */
export async function submitBusinessClaim(
  input: SubmitBusinessClaimInput,
): Promise<BusinessClaim> {
  const { data, error } = await supabase
    .from("business_claims")
    .insert({
      business_id: input.businessId,
      claimant_user_id: input.claimantUserId,
      message: input.message ?? null,
      contact_name: input.contactName ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch the current user's latest claim for a business (if any).
 * Used to reflect claim status on the business profile.
 */
export async function fetchMyClaimForBusiness(
  businessId: string,
  userId: string,
): Promise<BusinessClaim | null> {
  const { data, error } = await supabase
    .from("business_claims")
    .select("*")
    .eq("business_id", businessId)
    .eq("claimant_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Validate a claim invite token. Returns the target business summary only when
 * the token is pending, unexpired, and the business is still unclaimed.
 *
 * Backed by the `validate_business_claim_token` SECURITY DEFINER RPC so the
 * invites table is never directly exposed and the claim screen is link-gated.
 */
export async function validateBusinessClaimToken(
  token: string,
): Promise<BusinessClaimTokenPreview | null> {
  const { data, error } = await supabase.rpc("validate_business_claim_token", {
    p_token: token,
  });

  if (error) throw error;

  const row = data?.[0];
  if (!row) return null;

  return {
    businessId: row.business_id,
    businessName: row.business_name,
    businessLogoUrl: row.business_logo_url ?? null,
    businessEmail: row.business_email ?? null,
    inviteEmail: row.invite_email,
    expiresAt: row.expires_at,
  };
}

/**
 * Submit a claim using a valid invite token (link-only claim flow). Requires an
 * authenticated user; the RPC ties the claim to link possession and marks the
 * invite accepted.
 */
export async function submitBusinessClaimWithToken(
  token: string,
  input: ClaimWithTokenInput,
): Promise<BusinessClaim> {
  const { data, error } = await supabase.rpc(
    "submit_business_claim_with_token",
    {
      p_token: token,
      // Web fix: optional RPC args are `string | undefined` under
      // supabase-js >=2.100; omitting them (undefined) hits the same SQL
      // defaults the app's `?? null` did.
      p_message: input.message ?? undefined,
      p_contact_name: input.contactName ?? undefined,
      p_contact_email: input.contactEmail ?? undefined,
      p_contact_phone: input.contactPhone ?? undefined,
    },
  );

  if (error) throw error;
  return data;
}

/** Minimum characters before the onboarding claim search runs. */
export const CLAIM_SEARCH_MIN_CHARS = 2;

/**
 * Search unclaimed (admin-posted) listings by name so a business owner can find
 * and claim an existing profile during onboarding. Only approved, unowned
 * listings are returned — the same rows residents already see publicly.
 */
export async function searchUnclaimedBusinesses(
  query: string,
): Promise<UnclaimedBusinessSummary[]> {
  const q = query.trim();
  if (q.length < CLAIM_SEARCH_MIN_CHARS) return [];

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, address, logo_url")
    .is("user_id", null)
    .eq("status", "approved")
    .ilike("name", `%${q}%`)
    .order("name", { ascending: true })
    .limit(10);

  if (error) throw error;
  return (data ?? []) as UnclaimedBusinessSummary[];
}

/**
 * The current user's most recent claim across all businesses (if any).
 * Drives the "claim pending" holding state for owners who claimed rather than
 * created a listing.
 */
export async function fetchMyLatestClaim(
  userId: string,
): Promise<BusinessClaim | null> {
  const { data, error } = await supabase
    .from("business_claims")
    .select("*")
    .eq("claimant_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Admin: list claims, optionally filtered by status, with joined business info.
 */
export async function fetchBusinessClaims(
  status?: BusinessClaimStatus,
): Promise<BusinessClaimWithBusiness[]> {
  let query = supabase
    .from("business_claims")
    .select(CLAIM_WITH_BUSINESS_SELECT)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as BusinessClaimWithBusiness[];
}

/**
 * Admin: fetch a single claim with joined business info (claim-review screen).
 */
export async function fetchBusinessClaimById(
  claimId: string,
): Promise<BusinessClaimWithBusiness | null> {
  const { data, error } = await supabase
    .from("business_claims")
    .select(CLAIM_WITH_BUSINESS_SELECT)
    .eq("id", claimId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as BusinessClaimWithBusiness) ?? null;
}

/**
 * Admin: approve a claim (assigns ownership atomically via RPC).
 * @returns the business id that was claimed.
 */
export async function approveBusinessClaim(claimId: string): Promise<string> {
  const { data, error } = await supabase.rpc("approve_business_claim", {
    p_claim_id: claimId,
  });

  if (error) throw error;

  // Notify the claimant their claim was approved (async, non-blocking).
  sendClaimApprovedEmail(claimId).catch((err) =>
    console.error("[approveBusinessClaim] Email send failed:", err),
  );

  return data as string;
}

/**
 * Admin: reject a claim with a reason (via RPC).
 */
export async function rejectBusinessClaim(
  claimId: string,
  reason: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("reject_business_claim", {
    p_claim_id: claimId,
    p_reason: reason,
  });

  if (error) throw error;
  return data as string;
}
