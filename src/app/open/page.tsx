import type { Metadata } from "next";
import { getPublicAppOrigin } from "@/shared/config/public-app";
import {
  getAndroidPlayStoreUrl,
  getIosAppStoreUrl,
} from "@/shared/config/store-links";
import { buildNativeOpenUrl } from "@/shared/lib/native-deeplink";
import { OpenInAppPanel } from "@/shared/ui/open-in-app-panel";

export async function generateMetadata(): Promise<Metadata> {
  let canonical: string | undefined;
  try {
    canonical = `${getPublicAppOrigin()}/open`;
  } catch {
    /* e.g. local build without env */
  }
  return {
    title: "Open in Buzlee",
    description: "Open this link in the Buzlee app, or get the app from a store.",
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: { index: false, follow: false },
  };
}

function firstParam(
  value: string | string[] | undefined,
): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return "";
}

export default async function OpenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pathParam = firstParam(sp.path);
  const nativeHref = buildNativeOpenUrl(pathParam);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <OpenInAppPanel
        nativeHref={nativeHref}
        heading="Continue in the Buzlee app"
        subheading="This link works best in the app. Open Buzlee below, or install it from a store."
        iosStoreUrl={getIosAppStoreUrl()}
        androidStoreUrl={getAndroidPlayStoreUrl()}
      />
    </div>
  );
}
