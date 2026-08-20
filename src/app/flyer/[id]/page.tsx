import type { Metadata } from "next";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <Card variant="flyer" className="mx-auto w-full max-w-md">
            {image ? (
              <div className="bg-muted/60">
                <Image
                  src={image}
                  alt={flyer.title}
                  width={800}
                  height={1200}
                  className="h-auto w-full object-contain"
                  sizes="(max-width: 448px) 100vw, 448px"
                  priority
                />
              </div>
            ) : null}
            <CardHeader className="gap-1.5 border-t border-border/40 px-5 py-4">
              <CardTitle className="text-balance text-base font-medium tracking-tight text-foreground">
                {flyer.title}
              </CardTitle>
              {flyer.businesses?.name ? (
                <CardDescription className="text-sm font-normal">
                  {flyer.businesses.name}
                </CardDescription>
              ) : null}
            </CardHeader>
            {eventDate || location ? (
              <CardContent className="flex flex-col gap-0.5 px-5 pb-4 pt-0 text-sm text-muted-foreground">
                {eventDate ? <p>{eventDate}</p> : null}
                {location ? <p>{location}</p> : null}
              </CardContent>
            ) : null}
          </Card>
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
