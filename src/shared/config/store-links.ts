/** Default public store listings (override with NEXT_PUBLIC_* in Vercel if needed). */
const DEFAULT_IOS_APP_STORE_URL =
  "https://apps.apple.com/app/id6760479664" as const;
const DEFAULT_ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.buzlee" as const;

/** Install attribution for store links opened from a share page. */
export type StoreCampaign = {
  /** Apple campaign token (`ct`). */
  name: "share_flyer" | "share_business";
  /** Flyer or business id; Play surfaces it as `utm_content` in the install referrer. */
  id: string;
};

/** Append query params to a URL; a malformed override is returned untouched. */
function withSearchParams(url: string, params: Record<string, string>): string {
  try {
    const u = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      u.searchParams.set(key, value);
    }
    return u.toString();
  } catch {
    return url;
  }
}

export function getIosAppStoreUrl(campaign?: StoreCampaign): string {
  const url =
    process.env.NEXT_PUBLIC_IOS_APP_STORE_URL ?? DEFAULT_IOS_APP_STORE_URL;
  // No App Store Connect provider token (`pt`) is configured, so only `ct` is sent.
  return campaign ? withSearchParams(url, { ct: campaign.name }) : url;
}

export function getAndroidPlayStoreUrl(campaign?: StoreCampaign): string {
  const url =
    process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL ??
    DEFAULT_ANDROID_PLAY_STORE_URL;
  if (!campaign) return url;
  // Play hands `referrer` to the app verbatim (Install Referrer API). URLSearchParams
  // encodes it once: `referrer=utm_source%3Dshare%26utm_content%3D<id>`.
  return withSearchParams(url, {
    referrer: `utm_source=share&utm_content=${campaign.id}`,
  });
}
