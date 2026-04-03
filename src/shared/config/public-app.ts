/**
 * Canonical public web app origin and auth callback URL for app.buzlee.com (Supabase redirects, meta).
 * Mirrors the contract documented in buzlee-app `AUTH_CALLBACK_URL` / `getAuthCallbackUrl()`.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function devFallbackOrigin(): string {
  return "http://127.0.0.1:3000";
}

/**
 * Public HTTPS origin (no trailing slash), e.g. https://app.buzlee.com
 */
export function getPublicAppOrigin(): string {
  const fullCallback = process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL;
  if (fullCallback) {
    return trimTrailingSlash(new URL(fullCallback).origin);
  }
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (origin) {
    return trimTrailingSlash(origin);
  }
  if (process.env.NODE_ENV === "development") {
    return devFallbackOrigin();
  }
  throw new Error(
    "Missing NEXT_PUBLIC_APP_ORIGIN or NEXT_PUBLIC_AUTH_CALLBACK_URL",
  );
}

/**
 * Full Supabase redirect URL (must match Dashboard allowlist and Expo AUTH_CALLBACK_URL).
 */
export function getAuthCallbackUrl(): string {
  const full = process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL;
  if (full) {
    return trimTrailingSlash(full);
  }
  return `${getPublicAppOrigin()}/auth/callback`;
}

/**
 * Custom scheme base for “Open in app” (production: buzlee; preview/dev may differ in Expo).
 */
export function getPublicAppScheme(): string {
  return process.env.NEXT_PUBLIC_APP_SCHEME ?? "buzlee";
}
