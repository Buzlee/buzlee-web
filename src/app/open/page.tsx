import type { Metadata } from "next";
import Image from "next/image";
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
    description:
      "Open this link in the Buzlee app, or get the app from a store.",
    ...(canonical ? { alternates: { canonical } } : {}),
    robots: { index: false, follow: false },
  };
}

function firstParam(value: string | string[] | undefined): string {
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
    <div className="flex min-h-full flex-1 flex-col items-center bg-primary/5 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <Image
        src="/logo-full.svg"
        alt="Buzlee"
        width={144}
        height={93}
        className="mb-5 h-auto w-[min(144px,65vw)] shrink-0"
        priority
      />
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <OpenInAppPanel
          nativeHref={nativeHref}
          heading="Continue in the Buzlee app"
          subheading="Open Buzlee below, or install it from a store."
          iosStoreUrl={getIosAppStoreUrl()}
          androidStoreUrl={getAndroidPlayStoreUrl()}
        />
      </div>
    </div>
  );
}
