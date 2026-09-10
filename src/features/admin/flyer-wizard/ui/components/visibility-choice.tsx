"use client";

import type { FlyerVisibility } from "@/entities/flyer/model/types";
import { useActiveMemberCount } from "@/entities/member/api/use-member";
import { Field } from "@/features/admin/businesses/business-form";
import { ChoiceChips } from "./choice-chips";

const OPTIONS: { value: FlyerVisibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "members_only", label: "Members only" },
];

export function visibilityHelperCopy(
  value: FlyerVisibility,
  memberCount: number,
): string {
  if (value !== "members_only") return "Visible to everyone on Buzlee.";
  if (memberCount === 0)
    return "No members yet. The business can invite people from its Members tab.";
  return `${memberCount} ${memberCount === 1 ? "member" : "members"} will be notified when this goes live.`;
}

/**
 * "Who can see it" — Public / Members only chips with the live member-count
 * helper (same copy as the app).
 */
export function VisibilityChoice({
  businessId,
  value,
  onChange,
  disabled = false,
}: {
  businessId: string;
  value: FlyerVisibility;
  onChange: (value: FlyerVisibility) => void;
  disabled?: boolean;
}) {
  const { data: memberCount = 0 } = useActiveMemberCount(businessId);
  return (
    <Field
      hint={visibilityHelperCopy(value, memberCount)}
      htmlFor="flyer-visibility"
      label="Who can see it"
    >
      <ChoiceChips<FlyerVisibility>
        aria-label="Who can see it"
        disabled={disabled}
        onChange={onChange}
        options={OPTIONS}
        value={value}
      />
    </Field>
  );
}
