"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminBusiness } from "@/entities/admin";
import { geocodedLocationFromStoredJson } from "@/entities/location";
import { FlyerWizardScreen } from "@/features/admin/flyer-wizard";
import { PageHeader } from "@/features/admin/shell/page-header";

/**
 * `/admin/flyers/new?business=<id>` — web counterpart of the app's
 * `(admin-detail)/create-flyer/[businessId]`: the flyer wizard posting on
 * behalf of an approved business.
 */
export function CreateFlyerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business") ?? "";
  const { data: business, isLoading, error } = useAdminBusiness(businessId);

  const businessHref = `/admin/businesses/review?id=${businessId}`;

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        title={
          <span className="flex items-center gap-2 truncate">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={businessId ? businessHref : "/admin/businesses"}
            >
              {business?.name ?? "Businesses"}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="truncate">Create flyer</span>
          </span>
        }
      />
      {!businessId ? (
        <p className="p-6 text-sm text-muted-foreground">
          Pick a business first — flyers are created from its review page.
        </p>
      ) : isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      ) : error || !business ? (
        <p className="p-6 text-sm text-destructive">
          {error ? "Failed to load business." : "Business not found."}
        </p>
      ) : (
        <FlyerWizardScreen
          businessId={business.id}
          businessLocation={geocodedLocationFromStoredJson(business.location)}
          businessName={business.name}
          businessStatus={business.status}
          onCancel={() => router.push(businessHref)}
          onDismissSuccess={() => router.replace(businessHref)}
        />
      )}
    </div>
  );
}
