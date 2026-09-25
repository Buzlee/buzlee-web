"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminBusiness } from "@/entities/admin";
import { useFlyer } from "@/entities/flyer/api/use-flyer";
import { geocodedLocationFromStoredJson } from "@/entities/location";
import { FlyerWizardScreen } from "@/features/admin/flyer-wizard";
import { PageHeader } from "@/features/admin/shell/page-header";

/**
 * `/admin/flyers/edit?id=<flyerId>` — web counterpart of the app's
 * `(admin-detail)/edit-flyer/[id]`: the wizard's edit hub for an existing
 * flyer (draft → review layout, live → Save changes / Unpublish / Delete).
 */
export function EditFlyerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flyerId = searchParams.get("id") ?? "";
  const {
    data: flyer,
    isLoading: flyerLoading,
    error: flyerError,
  } = useFlyer(flyerId);
  const {
    data: business,
    isLoading: businessLoading,
    error: businessError,
  } = useAdminBusiness(flyer?.business_id ?? "");

  const reviewHref = `/admin/flyers/review?id=${flyerId}`;
  const businessHref = business
    ? `/admin/businesses/review?id=${business.id}`
    : "/admin/flyers";

  const message = !flyerId
    ? "No flyer selected."
    : flyerError
      ? "Failed to load flyer."
      : !flyerLoading && !flyer
        ? "Flyer not found."
        : businessError
          ? "Failed to load business."
          : !businessLoading && flyer && !business
            ? "Business not found."
            : null;

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        title={
          <span className="flex items-center gap-2 truncate">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/admin/flyers"
            >
              Flyers
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="truncate">
              {flyer ? `Edit “${flyer.title}”` : "Edit flyer"}
            </span>
          </span>
        }
      />
      {message ? (
        <p className="p-6 text-sm text-muted-foreground">{message}</p>
      ) : flyerLoading || businessLoading || !flyer || !business ? (
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <FlyerWizardScreen
          businessId={business.id}
          businessLocation={geocodedLocationFromStoredJson(business.location)}
          businessName={business.name}
          businessStatus={business.status}
          flyerId={flyer.id}
          onCancel={() => router.push(reviewHref)}
          onDismissSuccess={() => router.replace(businessHref)}
          onPreview={() => router.push(reviewHref)}
        />
      )}
    </div>
  );
}
