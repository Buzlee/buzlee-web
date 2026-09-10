// PORTED FROM buzlee-app/src/entities/member/api/use-member.ts — keep in sync; see docs/admin-sync.md
// Web trim: key factory + `useActiveMemberCount` only.
import { useQuery } from "@tanstack/react-query";
import { fetchActiveMemberCount } from "./member-queries";

export const memberKeys = {
  all: ["members"] as const,
  byBusiness: (businessId: string) =>
    [...memberKeys.all, "business", businessId] as const,
  invitesByBusiness: (businessId: string) =>
    [...memberKeys.all, "invites", businessId] as const,
  countByBusiness: (businessId: string) =>
    [...memberKeys.all, "count", businessId] as const,
};

export function useActiveMemberCount(businessId: string) {
  return useQuery({
    queryKey: memberKeys.countByBusiness(businessId),
    queryFn: () => fetchActiveMemberCount(businessId),
    enabled: !!businessId,
  });
}
