// PORTED FROM buzlee-app/src/entities/admin/lib/send-business-claim-invite.ts — keep in sync; see docs/admin-sync.md
/**
 * Send a "claim your business" invitation email to an unclaimed listing's
 * contact address via the admin-secured edge function.
 */
import { supabase } from "@/shared/lib/supabase";

/**
 * Invokes the business-claim-invite edge function for the given business.
 * The function authorizes the caller as an admin and validates that the
 * listing is unclaimed and has a contact email. Throws on failure so the
 * admin UI can surface the result.
 */
export async function sendBusinessClaimInvite(
  businessId: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    "business-claim-invite",
    {
      body: { businessId },
    },
  );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error.message ?? "Failed to send claim invite");
  }
}
