// PORTED FROM buzlee-app/src/entities/business-claim/lib/send-claim-approved-email.ts — keep in sync; see docs/admin-sync.md
/**
 * Send the claim-approved email to the claimant via Supabase Edge Function.
 */
import { supabase } from "@/shared/lib/supabase";

/**
 * Notify a claimant that their business claim was approved.
 * Calls the business-claim-approved-email edge function, which resolves the
 * recipient and business name server-side from the claim id.
 */
export async function sendClaimApprovedEmail(claimId: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "business-claim-approved-email",
      {
        body: { claimId },
      },
    );

    if (error) {
      console.error("[sendClaimApprovedEmail] Edge function error:", {
        name: error.name,
        message: error.message,
        context: error.context,
      });
      throw error;
    }

    if (data?.error) {
      console.error(
        "[sendClaimApprovedEmail] Email service error:",
        data.error,
      );
      throw new Error(data.error.message);
    }
  } catch (error) {
    // Email failure must not block approval — log for monitoring only.
    console.error("[sendClaimApprovedEmail] Failed to send email:", error);
  }
}
