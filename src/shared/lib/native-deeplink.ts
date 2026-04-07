import { getPublicAppScheme } from "@/shared/config/public-app";

/**
 * Native handoff for Supabase auth: same path as HTTPS `/auth/callback`, same query string.
 * Aligns with buzlee-app `deep-linking.ts` (e.g. `code`, `token_hash`, `type`, `next`).
 */
export function buildNativeAuthCallbackUrl(queryString: string): string {
  const scheme = getPublicAppScheme();
  const q = queryString.replace(/^\?/, "");
  return q ? `${scheme}://auth/callback?${q}` : `${scheme}://auth/callback`;
}

/**
 * Transactional `/open` handoff: `path` query → `scheme://` + path for “Open in app” (see buzlee-app `isHttpsOpenAppLandingUrl`).
 */
export function buildNativeOpenUrl(pathParam: string): string {
  const scheme = getPublicAppScheme();
  const trimmed = pathParam.replace(/^\//, "");
  return trimmed ? `${scheme}://${trimmed}` : `${scheme}://`;
}
