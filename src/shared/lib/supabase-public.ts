/**
 * Read-only Supabase REST (PostgREST) access using the anon key.
 * RLS restricts anon to live flyers (`flyers_select_live_anon`) and approved
 * businesses (`businesses_select_approved_anon`) — see buzlee-app migrations
 * `0011_add-rls-policies.sql`. Server-side only (no NEXT_PUBLIC exposure).
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

const FLYER_SELECT =
  "id,title,description,event_date,event_end_date,location_name,location_address,cover_photo_url,media_url,media_type,businesses(name,logo_url)";

const BUSINESS_SELECT =
  "id,name,description,address,website,logo_url,cover_photo_url";

/** Tolerate values pasted with surrounding quotes or whitespace (e.g. copied from a quoted .env). */
function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']+|["']+$/g, "");
}

function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = cleanEnv(process.env.BUZLEE_SUPABASE_URL);
  const anonKey = cleanEnv(process.env.BUZLEE_SUPABASE_ANON_KEY);
  if (!url || !anonKey) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return { url: url.replace(/\/$/, ""), anonKey };
}

async function restSelectOne<T>(pathAndQuery: string): Promise<T | null> {
  const config = getSupabaseConfig();
  if (!config) return null;
  try {
    const res = await fetch(`${config.url}/rest/v1/${pathAndQuery}`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as T[];
    return Array.isArray(rows) ? (rows[0] ?? null) : null;
  } catch {
    return null;
  }
}

/** Live, non-expired flyer or null (missing, expired, or Supabase env unset). */
export async function fetchPublicFlyer(
  id: string,
): Promise<PublicFlyer | null> {
  if (!UUID_RE.test(id)) return null;
  return restSelectOne<PublicFlyer>(
    `flyers?id=eq.${id}&select=${FLYER_SELECT}&limit=1`,
  );
}

/** Approved business or null. */
export async function fetchPublicBusiness(
  id: string,
): Promise<PublicBusiness | null> {
  if (!UUID_RE.test(id)) return null;
  return restSelectOne<PublicBusiness>(
    `businesses?id=eq.${id}&select=${BUSINESS_SELECT}&limit=1`,
  );
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
