"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminUpdateBusiness } from "@/entities/admin";
import { useBusiness } from "@/entities/business/api/use-business";
import { businessUpdateFromGeocodedLocation } from "@/entities/business/lib/business-address-update";
import type {
  BusinessUpdate,
  BusinessWithDetails,
  SocialLinks,
} from "@/entities/business/model/types";
import { composeAddressWithUnit } from "@/entities/location";
import {
  BusinessFormFields,
  type BusinessFormState,
  cleanupRemovedAssets,
  formFromBusiness,
  NO_TOWN,
  nullable,
  SOCIAL_FIELDS,
  uploadStagedImages,
  validateBusinessForm,
} from "@/features/admin/businesses/business-form";

function locationKey(location: BusinessFormState["location"]): string {
  if (!location) return "";
  return `${location.lat},${location.lng}|${composeAddressWithUnit(location.formatted_address, location.unit)}`;
}

/**
 * Diff the edited form against the saved row, returning only changed
 * columns so an unrelated concurrent edit (e.g. from the mobile app) is not
 * clobbered by stale values. Image changes are handled separately (they
 * need an upload first).
 */
function buildPatch(
  initial: BusinessFormState,
  current: BusinessFormState,
): BusinessUpdate {
  const patch: BusinessUpdate = {};
  const name = current.name.trim();
  if (name !== initial.name) patch.name = name;
  if (current.category_id !== initial.category_id)
    patch.category_id = current.category_id;
  if (nullable(current.description) !== nullable(initial.description))
    patch.description = nullable(current.description);
  if (nullable(current.email) !== nullable(initial.email))
    patch.email = nullable(current.email);
  if (current.show_email !== initial.show_email)
    patch.show_email = current.show_email;
  if (nullable(current.phone) !== nullable(initial.phone))
    patch.phone = nullable(current.phone);
  if (nullable(current.website) !== nullable(initial.website))
    patch.website = nullable(current.website);
  if (locationKey(current.location) !== locationKey(initial.location)) {
    if (current.location) {
      Object.assign(
        patch,
        businessUpdateFromGeocodedLocation(current.location),
      );
    } else {
      patch.address = null;
      patch.location = null;
    }
  }
  if (current.town_id !== initial.town_id)
    patch.town_id = current.town_id === NO_TOWN ? null : current.town_id;

  const socialDirty = SOCIAL_FIELDS.some(
    ({ key }) =>
      nullable(current.social[key]) !== nullable(initial.social[key]),
  );
  if (socialDirty) {
    const next: SocialLinks = {
      facebook: nullable(current.social.facebook),
      instagram: nullable(current.social.instagram),
      yelp: nullable(current.social.yelp),
      google_business: nullable(current.social.google_business),
    };
    patch.social_links = next;
  }
  return patch;
}

function EditBusinessForm({
  business,
  onDone,
  onCancel,
}: {
  business: BusinessWithDetails;
  onDone: () => void;
  onCancel: () => void;
}) {
  const initial = formFromBusiness(business);
  const [form, setForm] = useState<BusinessFormState>(initial);
  const [uploading, setUploading] = useState(false);
  const update = useAdminUpdateBusiness(business.id);

  const patch = buildPatch(initial, form);
  const imagesDirty = form.logo.kind !== "keep" || form.cover.kind !== "keep";
  const dirty = Object.keys(patch).length > 0 || imagesDirty;

  const errors = validateBusinessForm(form);
  const valid = Object.keys(errors).length === 0;
  const busy = update.isPending || uploading;
  const canSave = dirty && valid && !busy;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    setUploading(true);
    try {
      const { patch: mediaPatch, cleanup } = await uploadStagedImages(
        business.id,
        form,
        {
          logo_url: business.logo_url,
          cover_photo_url: business.cover_photo_url,
        },
      );
      await update.mutateAsync({ ...patch, ...mediaPatch });
      // Only delete removed assets once the null column is persisted.
      await cleanupRemovedAssets(cleanup);
      toast.success(`Saved changes to ${form.name.trim()}`);
      onDone();
    } catch (error) {
      toast.error(
        `Save failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
        <BusinessFormFields
          busy={busy}
          current={business}
          errors={errors}
          form={form}
          idPrefix="edit"
          onChange={setForm}
        />
      </div>

      <SheetFooter className="flex-row justify-end border-t border-border">
        <Button
          disabled={busy}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="bg-foreground text-background hover:bg-foreground/90"
          disabled={!canSave}
          type="submit"
        >
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </SheetFooter>
    </form>
  );
}

/**
 * Side sheet for editing a business's details from the admin review screen.
 * Same field set as buzlee-app's admin edit-business screen, including
 * logo/cover upload and the geocoded address picker (map pin).
 *
 * Loads the full `businesses` row (the admin summary omits `social_links`
 * and `show_email`) and remounts the form whenever the saved row changes so
 * a reopened sheet never shows stale edits.
 */
export function EditBusinessSheet({
  businessId,
  open,
  onOpenChange,
}: {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: business,
    error,
    isLoading,
  } = useBusiness(open ? businessId : "");

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Edit details</SheetTitle>
          <SheetDescription>
            {business
              ? `Changes to ${business.name} publish immediately.`
              : "Changes publish immediately."}
          </SheetDescription>
        </SheetHeader>
        {business ? (
          <EditBusinessForm
            business={business}
            key={`${business.id}:${business.updated_at}`}
            onCancel={() => onOpenChange(false)}
            onDone={() => onOpenChange(false)}
          />
        ) : open ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Loading…"
                : error
                  ? `Couldn't load business: ${error.message}`
                  : "Business not found."}
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
