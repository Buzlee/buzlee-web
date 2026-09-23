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
 * `query` entries with a value are appended after any query already in `path`,
 * e.g. `("flyer/<id>", { event })` → `buzlee://flyer/<id>?event=<flyerEventId>`.
 */
export function buildNativeOpenUrl(
  pathParam: string,
  query?: Record<string, string | null | undefined>,
): string {
  const scheme = getPublicAppScheme();
  const trimmed = pathParam.replace(/^\//, "");
  const base = trimmed ? `${scheme}://${trimmed}` : `${scheme}://`;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) qs.set(key, value);
  }
  const q = qs.toString();
  if (!q) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${q}`;
}
