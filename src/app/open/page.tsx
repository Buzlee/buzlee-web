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
    title: "Open Buzlee",
    description: "Continue in the Buzlee app.",
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: { index: false, follow: false },
  };
}

export default async function OpenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pathRaw = sp.path;
  const path =
    typeof pathRaw === "string"
      ? pathRaw
      : Array.isArray(pathRaw)
        ? (pathRaw[0] ?? "")
        : "";
  const nativeHref = buildNativeOpenUrl(path);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <OpenInAppPanel
        nativeHref={nativeHref}
        heading="Open Buzlee"
        subheading="This link is meant to open in the Buzlee app. Tap below or install from a store."
        iosStoreUrl={getIosAppStoreUrl()}
        androidStoreUrl={getAndroidPlayStoreUrl()}
      />
    </div>
  );
}
