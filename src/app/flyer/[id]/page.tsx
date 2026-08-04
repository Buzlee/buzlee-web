import type { Metadata } from "next";
import Image from "next/image";
import { getPublicAppOrigin } from "@/shared/config/public-app";
import {
  getAndroidPlayStoreUrl,
  getIosAppStoreUrl,
} from "@/shared/config/store-links";
import { buildNativeOpenUrl } from "@/shared/lib/native-deeplink";
import {
  fetchPublicFlyer,
  formatEventDate,
  publicFlyerImageUrl,
} from "@/shared/lib/supabase-public";
import { OpenInAppPanel } from "@/shared/ui/open-in-app-panel";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const flyer = await fetchPublicFlyer(id);

  let canonical: string | undefined;
  try {
    canonical = `${getPublicAppOrigin()}/flyer/${id}`;
  } catch {
    /* e.g. local build without env */
  }

  if (!flyer) {
    return {
      title: "Flyer",
      description: "This flyer is no longer available on Buzlee.",
      robots: { index: false, follow: false },
    };
  }

  const image = publicFlyerImageUrl(flyer);
  const description =
    flyer.description?.trim() ||
    `See ${flyer.title} and more local events on Buzlee.`;

  return {
    title: flyer.title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      title: flyer.title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
    robots: { index: false, follow: false },
  };
}

export default async function FlyerSharePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const flyer = await fetchPublicFlyer(id);
  const nativeHref = buildNativeOpenUrl(`flyer/${id}`);

  const image = flyer ? publicFlyerImageUrl(flyer) : null;
  const eventDate = flyer ? formatEventDate(flyer.event_date) : null;
  const location = flyer ? flyer.location_name || flyer.location_address : null;

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
        {flyer ? (
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-card shadow-lg ring-1 ring-border/70">
            {image ? (
              <Image
                src={image}
                alt={flyer.title}
                width={800}
                height={600}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : null}
            <div className="flex flex-col gap-1.5 px-6 py-5">
              <h2 className="text-balance text-lg font-semibold tracking-tight text-foreground">
                {flyer.title}
              </h2>
              {flyer.businesses?.name ? (
                <p className="text-sm font-medium text-muted-foreground">
                  {flyer.businesses.name}
                </p>
              ) : null}
              {eventDate ? (
                <p className="text-sm text-muted-foreground">{eventDate}</p>
              ) : null}
              {location ? (
                <p className="text-sm text-muted-foreground">{location}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        <OpenInAppPanel
          nativeHref={nativeHref}
          heading={
            flyer
              ? "View this flyer in the Buzlee app"
              : "This flyer is no longer available"
          }
          subheading={
            flyer
              ? "Open Buzlee below, or install it from a store."
              : "It may have ended or been removed. Get Buzlee to discover what's happening around you."
          }
          iosStoreUrl={getIosAppStoreUrl()}
          androidStoreUrl={getAndroidPlayStoreUrl()}
        />
      </div>
    </div>
  );
}
