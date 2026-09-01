// PORTED FROM buzlee-app/src/entities/business-claim/model/types.ts — keep in sync; see docs/admin-sync.md
import type { Database } from "@/types/database";

export type BusinessClaim =
  Database["public"]["Tables"]["business_claims"]["Row"];
export type BusinessClaimInsert =
  Database["public"]["Tables"]["business_claims"]["Insert"];
export type BusinessClaimStatus =
  Database["public"]["Enums"]["business_claim_status"];

/** Minimal business fields joined into an admin claim row. */
export type BusinessClaimBusiness = {
  id: string;
  name: string;
  email: string;
  logo_url: string | null;
  status: Database["public"]["Enums"]["business_status"];
  user_id: string | null;
};

export type BusinessClaimWithBusiness = BusinessClaim & {
  business: BusinessClaimBusiness | null;
};

/** Minimal unclaimed-business shape returned by the onboarding claim search. */
export type UnclaimedBusinessSummary = {
  id: string;
  name: string;
  address: string | null;
  logo_url: string | null;
};

/** Fields a claimant submits when requesting ownership of a business. */
export type SubmitBusinessClaimInput = {
  businessId: string;
  claimantUserId: string;
  message?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

/** Contact/verification fields submitted with a tokenized claim invite. */
export type ClaimWithTokenInput = {
  message?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

/** Business summary returned when a claim invite token is valid (link-only claim flow). */
export type BusinessClaimTokenPreview = {
  businessId: string;
  businessName: string;
  businessLogoUrl: string | null;
  businessEmail: string | null;
  inviteEmail: string;
  expiresAt: string;
};
