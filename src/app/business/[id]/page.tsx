import type { Metadata } from "next";
import Image from "next/image";
import { getPublicAppOrigin } from "@/shared/config/public-app";
import {
  getAndroidPlayStoreUrl,
  getIosAppStoreUrl,
} from "@/shared/config/store-links";
import { buildNativeOpenUrl } from "@/shared/lib/native-deeplink";
import { fetchPublicBusiness } from "@/shared/lib/supabase-public";
import { OpenInAppPanel } from "@/shared/ui/open-in-app-panel";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const business = await fetchPublicBusiness(id);

  let canonical: string | undefined;
  try {
    canonical = `${getPublicAppOrigin()}/business/${id}`;
  } catch {
    /* e.g. local build without env */
  }

  if (!business) {
    return {
      title: "Business",
      description: "This business is not available on Buzlee.",
      robots: { index: false, follow: false },
    };
  }

  const image = business.cover_photo_url || business.logo_url;
  const description =
    business.description?.trim() ||
    `Check out ${business.name} and more local businesses on Buzlee.`;

  return {
    title: business.name,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: business.name,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
    robots: { index: false, follow: false },
  };
}

export default async function BusinessSharePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const business = await fetchPublicBusiness(id);
  const nativeHref = buildNativeOpenUrl(`business/${id}`);

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
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
        {business ? (
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg ring-1 ring-border/70">
            {business.cover_photo_url ? (
              <Image
                src={business.cover_photo_url}
                alt={business.name}
                width={800}
                height={373}
                className="aspect-[3/1.4] w-full object-cover"
              />
            ) : null}
            <div className="flex items-center gap-4 px-6 py-5">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt=""
                  width={112}
                  height={112}
                  className="size-14 shrink-0 rounded-full border border-border/60 object-cover"
                />
              ) : null}
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-balance text-lg font-semibold tracking-tight text-foreground">
                  {business.name}
                </h2>
                {business.address ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {business.address}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        <OpenInAppPanel
          nativeHref={nativeHref}
          heading={
            business
              ? `View ${business.name} in the Buzlee app`
              : "This business isn't available"
          }
          subheading={
            business
              ? "Open Buzlee below, or install it from a store."
              : "It may have been removed. Get Buzlee to discover local businesses around you."
          }
          iosStoreUrl={getIosAppStoreUrl()}
          androidStoreUrl={getAndroidPlayStoreUrl()}
        />
      </div>
    </div>
  );
}
