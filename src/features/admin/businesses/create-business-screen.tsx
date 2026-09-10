"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminKeys, useAdminCreateBusiness } from "@/entities/admin";
import { updateBusiness } from "@/entities/business/api/business-queries";
import { businessKeys } from "@/entities/business/api/use-business";
import { businessUpdateFromGeocodedLocation } from "@/entities/business/lib/business-address-update";
import { cleanSocialLinks } from "@/entities/business/lib/social-links";
import type { BusinessUpdate } from "@/entities/business/model/types";
import {
  BusinessFormFields,
  emptyBusinessForm,
  NO_TOWN,
  nullable,
  uploadStagedImages,
  validateBusinessForm,
} from "./business-form";

/**
 * Admin "Create business" (web). Mirrors buzlee-app's create-business screen:
 * posts an approved, unclaimed listing on the admin's behalf, then uploads
 * any staged logo/cover and patches the URLs onto the new row. A failed media
 * upload does not orphan the listing — the admin is told and can retry from
 * Edit details.
 */
export function CreateBusinessScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const create = useAdminCreateBusiness();
  const [form, setForm] = useState(emptyBusinessForm);
  const [saving, setSaving] = useState(false);

  const errors = validateBusinessForm(form);
  const valid = Object.keys(errors).length === 0;
  const canSubmit = valid && !saving;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const address = form.location
        ? businessUpdateFromGeocodedLocation(form.location)
        : { address: null, location: null };

      const business = await create.mutateAsync({
        name: form.name.trim(),
        email: nullable(form.email),
        categoryId: form.category_id,
        phone: nullable(form.phone),
        website: nullable(form.website),
        description: nullable(form.description),
        socialLinks: cleanSocialLinks(form.social),
        address: address.address ?? null,
        location: (address.location ?? null) as Record<string, unknown> | null,
        townId: form.town_id === NO_TOWN ? null : form.town_id,
      });

      // Media is staged locally until the row exists, then uploaded here.
      let mediaFailed = false;
      try {
        const { patch } = await uploadStagedImages(business.id, form, {
          logo_url: null,
          cover_photo_url: null,
        });
        const updates: BusinessUpdate = { ...patch };
        if (!form.show_email) updates.show_email = false;
        if (Object.keys(updates).length > 0) {
          await updateBusiness(business.id, updates);
        }
      } catch (uploadError) {
        console.error("[CreateBusiness] Media upload failed:", uploadError);
        mediaFailed = true;
      }

      queryClient.invalidateQueries({ queryKey: adminKeys.businesses() });
      queryClient.invalidateQueries({ queryKey: businessKeys.all });

      if (mediaFailed) {
        toast.warning(
          `Created ${business.name}, but uploading its images failed. Add them from Edit details.`,
        );
      } else {
        toast.success(`Created ${business.name} as an unclaimed listing`);
      }
      router.replace(`/admin/businesses/review?id=${business.id}`);
    } catch (error) {
      toast.error(
        `Create failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setSaving(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6 p-6"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Post a listing on behalf of a business. It publishes immediately and
          stays unclaimed until an owner claims it.
        </p>

        <div className="flex flex-col gap-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <BusinessFormFields
            busy={saving}
            errors={errors}
            form={form}
            idPrefix="create"
            onChange={setForm}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={saving}
            onClick={() => router.back()}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="bg-foreground text-background hover:bg-foreground/90"
            disabled={!canSubmit}
            type="submit"
          >
            {saving ? "Creating…" : "Create business"}
          </Button>
        </div>
      </div>
    </form>
  );
}
