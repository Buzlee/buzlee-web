/** Default public store listings (override with NEXT_PUBLIC_* in Vercel if needed). */
const DEFAULT_IOS_APP_STORE_URL =
  "https://apps.apple.com/app/id6760479664" as const;
const DEFAULT_ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.buzlee" as const;

export function getIosAppStoreUrl(): string {
  return process.env.NEXT_PUBLIC_IOS_APP_STORE_URL ?? DEFAULT_IOS_APP_STORE_URL;
}

export function getAndroidPlayStoreUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL ??
    DEFAULT_ANDROID_PLAY_STORE_URL
  );
}
