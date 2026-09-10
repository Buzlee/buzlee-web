// PORTED FROM buzlee-app/src/entities/business/lib/social-links.ts — keep in sync; see docs/admin-sync.md
import type { SocialLinks } from "../model/types";

/**
 * Normalize user-entered social links for persistence: trims each value,
 * converts empty strings to null, and returns null when no link was entered
 * so the jsonb column stays null instead of holding an all-null object.
 */
export function cleanSocialLinks(
  input: SocialLinks | null | undefined,
): SocialLinks | null {
  if (!input) return null;
  const cleaned: SocialLinks = {
    facebook: input.facebook?.trim() || null,
    instagram: input.instagram?.trim() || null,
    yelp: input.yelp?.trim() || null,
    google_business: input.google_business?.trim() || null,
  };
  const hasAny = Object.values(cleaned).some(Boolean);
  return hasAny ? cleaned : null;
}
