// PORTED FROM buzlee-app/src/entities/flyer/lib/send-member-flyer-notification.ts — keep in sync; see docs/admin-sync.md
/**
 * Triggers member-flyer-notify (same payload shape as a DB webhook).
 * Mirrors {@link invokeBusinessMemberInviteNotify} in member/.
 */
import { supabase } from "@/shared/lib/supabase";
import type { Flyer } from "../model/types";

export const FLYERS_TABLE = "flyers" as const;

export type MemberFlyerNotifyRecord = {
  id: string;
  title: string;
  business_id: string;
  status: string;
  visibility: Flyer["visibility"];
};

export type MemberFlyerNotifyBody = {
  type: "INSERT" | "UPDATE";
  table: typeof FLYERS_TABLE;
  record: MemberFlyerNotifyRecord;
  old_record?: Partial<MemberFlyerNotifyRecord> | null;
};

export function toMemberFlyerNotifyRecord(
  flyer: Pick<Flyer, "id" | "title" | "business_id" | "status" | "visibility">,
): MemberFlyerNotifyRecord {
  return {
    id: flyer.id,
    title: flyer.title,
    business_id: flyer.business_id,
    status: flyer.status,
    visibility: flyer.visibility,
  };
}

export async function invokeMemberFlyerNotify(
  body: MemberFlyerNotifyBody,
): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "member-flyer-notify",
      {
        body,
      },
    );

    if (error) {
      console.error("[invokeMemberFlyerNotify] Edge function error:", {
        name: error.name,
        message: error.message,
        context: error.context,
      });
      return;
    }

    if (data && typeof data === "object" && "error" in data && data.error) {
      const err = data as { error?: { message?: string } };
      console.error(
        "[invokeMemberFlyerNotify] Notification error:",
        err.error?.message,
      );
      return;
    }

    console.log("[invokeMemberFlyerNotify] Notification processed:", data);
  } catch (e) {
    console.error("[invokeMemberFlyerNotify] Failed:", e);
  }
}
