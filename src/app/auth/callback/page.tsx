import type { Metadata } from "next";
import { getAuthCallbackUrl } from "@/shared/config/public-app";
import {
  getAndroidPlayStoreUrl,
  getIosAppStoreUrl,
} from "@/shared/config/store-links";
import { buildNativeAuthCallbackUrl } from "@/shared/lib/native-deeplink";
import { searchParamsToQueryString } from "@/shared/lib/search-params-to-query";
import { OpenInAppPanel } from "@/shared/ui/open-in-app-panel";

export async function generateMetadata(): Promise<Metadata> {
  let canonical: string | undefined;
  try {
    canonical = getAuthCallbackUrl();
  } catch {
    /* e.g. local build without env */
  }
  return {
    title: "Continue in Buzlee",
    description: "Open the Buzlee app to finish signing in.",
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: { index: false, follow: false },
  };
}

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const queryString = searchParamsToQueryString(sp);
  const nativeHref = buildNativeAuthCallbackUrl(queryString);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <OpenInAppPanel
        nativeHref={nativeHref}
        heading="Continue in the Buzlee app"
        subheading="Your email link opened in the browser. Use the app to finish signing in, or get Buzlee from a store below."
        iosStoreUrl={getIosAppStoreUrl()}
        androidStoreUrl={getAndroidPlayStoreUrl()}
      />
    </div>
  );
}
