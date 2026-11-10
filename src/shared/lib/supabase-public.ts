/**
 * Read-only Supabase access for the public share pages, using the anon key.
 * Server-side only (no NEXT_PUBLIC exposure).
 *
 * Reads go through two SECURITY DEFINER functions (buzlee-app migration
 * `20261109000100_guest_discovery.sql`, guest mode WP2):
 *   - `get_public_flyer(p_id)`    one live, unexpired, public flyer, or null
 *   - `get_public_business(p_id)` one approved business, or null
 * They return only what these pages render and never the business owner's
 * id or a hidden email. Guest mode WP5 drops the anon table policies
 * (`flyers_select_live_anon`, `businesses_select_approved_anon`), after which
 * a direct table read returns no rows.
 *
 * A database that predates the functions answers PGRST202. Only then do we
 * fall back to the old table read, so this file can ship to every branch
 * before that branch's migration. Remove the fallback once production has
 * `20261109000100`.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PublicFlyer = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  location_name: string | null;
  location_address: string;
  cover_photo_url: string | null;
  media_url: string;
  media_type: string;
  businesses: { name: string; logo_url: string | null } | null;
};

export type PublicBusiness = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
};

/** Legacy table reads, used only when the database predates the functions. */
const FLYER_SELECT =
  "id,title,description,event_date,event_end_date,location_name,location_address,cover_photo_url,media_url,media_type,businesses(name,logo_url)";

const BUSINESS_SELECT =
  "id,name,description,address,website,logo_url,cover_photo_url";

/** Tolerate values pasted with surrounding quotes or whitespace (e.g. copied from a quoted .env). */
function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']+|["']+$/g, "");
}

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url =
    cleanEnv(process.env.BUZLEE_SUPABASE_URL) ||
    cleanEnv(process.env.SUPABASE_URL) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey =
    cleanEnv(process.env.BUZLEE_SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.SUPABASE_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return { url: url.replace(/\/$/, ""), anonKey };
}

type RestResult =
  | { kind: "ok"; body: unknown }
  | { kind: "missing-function" }
  | { kind: "error" };

/**
 * GET so Next memoizes the call across `generateMetadata` and the page in
 * one render, and caches it for five minutes. `get_public_*` are STABLE, so
 * PostgREST accepts GET for them.
 */
async function restGet(pathAndQuery: string): Promise<RestResult> {
  const config = getSupabaseConfig();
  if (!config) return { kind: "error" };
  try {
    const res = await fetch(`${config.url}/rest/v1/${pathAndQuery}`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      next: { revalidate: 300 },
    });
    if (res.ok) return { kind: "ok", body: await res.json() };
    if (res.status === 404) {
      const err = (await res.json().catch(() => null)) as {
        code?: string;
      } | null;
      if (err?.code === "PGRST202") return { kind: "missing-function" };
    }
    return { kind: "error" };
  } catch {
    return { kind: "error" };
  }
}

async function restSelectOne<T>(pathAndQuery: string): Promise<T | null> {
  const result = await restGet(pathAndQuery);
  if (result.kind !== "ok" || !Array.isArray(result.body)) return null;
  return (result.body[0] as T | undefined) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** `get_public_flyer` JSON to the shape the flyer page renders. */
function toPublicFlyer(row: unknown): PublicFlyer | null {
  if (!isRecord(row) || typeof row.id !== "string") return null;
  if (typeof row.title !== "string" || typeof row.event_date !== "string") {
    return null;
  }
  const business = isRecord(row.business) ? row.business : null;
  return {
    id: row.id,
    title: row.title,
    description: stringOrNull(row.description),
    event_date: row.event_date,
    event_end_date: stringOrNull(row.event_end_date),
    location_name: stringOrNull(row.location_name),
    location_address: stringOrNull(row.location_address) ?? "",
    cover_photo_url: stringOrNull(row.cover_photo_url),
    media_url: stringOrNull(row.media_url) ?? "",
    media_type: stringOrNull(row.media_type) ?? "",
    businesses:
      business && typeof business.name === "string"
        ? { name: business.name, logo_url: stringOrNull(business.logo_url) }
        : null,
  };
}

/** `get_public_business` JSON to the shape the business page renders. */
function toPublicBusiness(row: unknown): PublicBusiness | null {
  if (!isRecord(row) || typeof row.id !== "string") return null;
  if (typeof row.name !== "string") return null;
  return {
    id: row.id,
    name: row.name,
    description: stringOrNull(row.description),
    address: stringOrNull(row.address),
    website: stringOrNull(row.website),
    logo_url: stringOrNull(row.logo_url),
    cover_photo_url: stringOrNull(row.cover_photo_url),
  };
}

/** Live, unexpired, public flyer or null (missing, ended, members-only, or Supabase env unset). */
export async function fetchPublicFlyer(
  id: string,
): Promise<PublicFlyer | null> {
  if (!UUID_RE.test(id)) return null;
  const result = await restGet(`rpc/get_public_flyer?p_id=${id}`);
  if (result.kind === "ok") return toPublicFlyer(result.body);
  if (result.kind === "missing-function") {
    return restSelectOne<PublicFlyer>(
      `flyers?id=eq.${id}&select=${FLYER_SELECT}&limit=1`,
    );
  }
  return null;
}

/** Approved business or null. */
export async function fetchPublicBusiness(
  id: string,
): Promise<PublicBusiness | null> {
  if (!UUID_RE.test(id)) return null;
  const result = await restGet(`rpc/get_public_business?p_id=${id}`);
  if (result.kind === "ok") return toPublicBusiness(result.body);
  if (result.kind === "missing-function") {
    return restSelectOne<PublicBusiness>(
      `businesses?id=eq.${id}&select=${BUSINESS_SELECT}&limit=1`,
    );
  }
  return null;
}

/** Cover image for previews/OG; media_url only when it is an image (may be video). */
export function publicFlyerImageUrl(flyer: PublicFlyer): string | null {
  if (flyer.cover_photo_url) return flyer.cover_photo_url;
  return flyer.media_type === "image" ? flyer.media_url : null;
}

/**
 * Format the date part of a naive event timestamp (`YYYY-MM-DD...`) without
 * timezone shifting — mirrors buzlee-app's local-naive handling.
 */
export function formatEventDate(eventDate: string): string | null {
  const m = eventDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
