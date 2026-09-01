// PORTED FROM buzlee-app/src/entities/admin/lib/send-business-status-email.ts — keep in sync; see docs/admin-sync.md
/**
 * Send business status change emails via Supabase Edge Function
 */
import { supabase } from "@/shared/lib/supabase";

export type BusinessStatusEmailPayload = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
};

/**
 * Send email notification when business status changes
 * Calls the business-status-email edge function
 */
export async function sendBusinessStatusEmail(
  payload: BusinessStatusEmailPayload,
): Promise<void> {
  try {
    console.log(
      "[sendBusinessStatusEmail] Sending email for:",
      payload.name,
      payload.status,
    );

    const { data, error } = await supabase.functions.invoke(
      "business-status-email",
      {
        body: {
          type: "UPDATE",
          table: "businesses",
          record: payload,
          old_record: null,
        },
      },
    );

    if (error) {
      console.error("[sendBusinessStatusEmail] Edge function error:", {
        name: error.name,
        message: error.message,
        context: error.context,
      });
      throw error;
    }

    // Check if the response contains an error (500 response with error object)
    if (data?.error) {
      console.error("[sendBusinessStatusEmail] Email service error:", {
        message: data.error.message,
        details: data.error.details,
      });

      // Log specific Resend errors
      if (data.error.message?.includes("verify a domain")) {
        console.warn(
          "[sendBusinessStatusEmail] ⚠️  Resend domain not verified. " +
            "Emails can only be sent to the registered email address. " +
            "To send to all users, verify a domain at https://resend.com/domains",
        );
      }

      throw new Error(data.error.message);
    }

    console.log("[sendBusinessStatusEmail] Email sent successfully:", data);
  } catch (error) {
    console.error("[sendBusinessStatusEmail] Failed to send email:", error);
    // Don't throw - email failure shouldn't block the approval/rejection
    // Just log it for monitoring
  }
}
