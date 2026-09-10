"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteBusinessAsset,
  uploadBusinessCoverPhoto,
  uploadBusinessLogo,
} from "@/entities/business/api/business-queries";
import type {
  BusinessUpdate,
  BusinessWithDetails,
  SocialLinks,
} from "@/entities/business/model/types";
import { useBusinessCategories, useTowns } from "@/entities/catalog";
import {
  type GeocodedLocation,
  geocodedLocationFromStoredJson,
} from "@/entities/location";
import { AddressField } from "@/features/admin/components/address-field";
import {
  type ImageChange,
  ImageField,
  KEEP_IMAGE,
} from "@/features/admin/components/image-field";
import {
  COVER_ASPECT,
  LOGO_ASPECT,
  prepareImage,
} from "@/features/admin/lib/image";
import { cn } from "@/lib/utils";

/** Radix Select cannot represent an empty-string value; sentinel for "no town". */
export const NO_TOWN = "__none__";

export const SOCIAL_FIELDS: {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/your-page",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/your-profile",
  },
  {
    key: "yelp",
    label: "Yelp",
    placeholder: "https://yelp.com/biz/your-business",
  },
  {
    key: "google_business",
    label: "Google Business",
    placeholder: "https://g.page/your-business",
  },
];

export type BusinessFormState = {
  name: string;
  category_id: string;
  description: string;
  email: string;
  show_email: boolean;
  phone: string;
  website: string;
  /** Geocoded address (map pin). `null` = no address. */
  location: GeocodedLocation | null;
  town_id: string;
  social: Record<keyof SocialLinks, string>;
  logo: ImageChange;
  cover: ImageChange;
};

export function emptyBusinessForm(): BusinessFormState {
  return {
    name: "",
    category_id: "",
    description: "",
    email: "",
    show_email: true,
    phone: "",
    website: "",
    location: null,
    town_id: NO_TOWN,
    social: { facebook: "", instagram: "", yelp: "", google_business: "" },
    logo: KEEP_IMAGE,
    cover: KEEP_IMAGE,
  };
}

export function formFromBusiness(
  business: BusinessWithDetails,
): BusinessFormState {
  const social = (business.social_links as SocialLinks | null) ?? {};
  return {
    ...emptyBusinessForm(),
    name: business.name,
    category_id: business.category_id,
    description: business.description ?? "",
    email: business.email ?? "",
    show_email: business.show_email !== false,
    phone: business.phone ?? "",
    website: business.website ?? "",
    location: geocodedLocationFromStoredJson(business.location),
    town_id: business.town_id ?? NO_TOWN,
    social: {
      facebook: social.facebook ?? "",
      instagram: social.instagram ?? "",
      yelp: social.yelp ?? "",
      google_business: social.google_business ?? "",
    },
  };
}

export function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export type BusinessFormErrors = Partial<
  Record<
    "name" | "category_id" | "email" | "website" | keyof SocialLinks,
    string
  >
>;

export function validateBusinessForm(
  form: BusinessFormState,
): BusinessFormErrors {
  const errors: BusinessFormErrors = {};
  if (!form.name.trim()) errors.name = "Business name is required.";
  if (!form.category_id) errors.category_id = "Choose a category.";
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!isValidUrl(form.website.trim()))
    errors.website = "Enter a full URL starting with http:// or https://.";
  for (const { key, label } of SOCIAL_FIELDS) {
    if (!isValidUrl(form.social[key].trim()))
      errors[key] =
        `Enter a full ${label} URL starting with http:// or https://.`;
  }
  return errors;
}

/**
 * Upload staged logo/cover for a business and return the resulting column
 * patch. Removals delete the saved asset only AFTER the caller has persisted
 * the null column, so a failed save never orphans the row's image.
 */
export async function uploadStagedImages(
  businessId: string,
  form: Pick<BusinessFormState, "logo" | "cover">,
  current: { logo_url: string | null; cover_photo_url: string | null },
): Promise<{
  patch: Pick<BusinessUpdate, "logo_url" | "cover_photo_url">;
  /** Saved asset URLs to delete once the patch is persisted. */
  cleanup: string[];
}> {
  const patch: Pick<BusinessUpdate, "logo_url" | "cover_photo_url"> = {};
  const cleanup: string[] = [];

  if (form.logo.kind === "replace") {
    const blob = await prepareImage(form.logo.file, {
      aspect: LOGO_ASPECT,
      maxSize: 1024,
    });
    patch.logo_url = await uploadBusinessLogo(
      businessId,
      blob,
      current.logo_url,
    );
  } else if (form.logo.kind === "remove") {
    patch.logo_url = null;
    if (current.logo_url) cleanup.push(current.logo_url);
  }

  if (form.cover.kind === "replace") {
    const blob = await prepareImage(form.cover.file, {
      aspect: COVER_ASPECT,
      maxSize: 1600,
    });
    patch.cover_photo_url = await uploadBusinessCoverPhoto(
      businessId,
      blob,
      current.cover_photo_url,
    );
  } else if (form.cover.kind === "remove") {
    patch.cover_photo_url = null;
    if (current.cover_photo_url) cleanup.push(current.cover_photo_url);
  }

  return { patch, cleanup };
}

export async function cleanupRemovedAssets(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => deleteBusinessAsset(url)));
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        htmlFor={htmlFor}
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

export const textareaClass =
  "min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * The full business field set, shared by the create page and the edit sheet.
 * Mirrors buzlee-app's create-business / edit-business screens: listing,
 * contact (+ show-email), geocoded address, town, logo/cover, social links.
 */
export function BusinessFormFields({
  form,
  onChange,
  errors,
  busy,
  idPrefix,
  current,
}: {
  form: BusinessFormState;
  onChange: (next: BusinessFormState) => void;
  errors: BusinessFormErrors;
  busy: boolean;
  idPrefix: string;
  /** Saved row (edit mode) — drives image previews and the legacy address hint. */
  current?: Pick<
    BusinessWithDetails,
    "logo_url" | "cover_photo_url" | "address"
  > | null;
}) {
  const { data: categories = [] } = useBusinessCategories();
  const { data: towns = [] } = useTowns();

  function set<K extends keyof BusinessFormState>(
    key: K,
    value: BusinessFormState[K],
  ) {
    onChange({ ...form, [key]: value });
  }

  function setSocial(key: keyof SocialLinks, value: string) {
    onChange({ ...form, social: { ...form.social, [key]: value } });
  }

  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionTitle>Listing</SectionTitle>
        <Field error={errors.name} htmlFor={id("name")} label="Business name">
          <Input
            aria-invalid={Boolean(errors.name)}
            autoComplete="organization"
            disabled={busy}
            id={id("name")}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Business name"
            value={form.name}
          />
        </Field>
        <Field
          error={errors.category_id}
          htmlFor={id("category")}
          label="Category"
        >
          <Select
            disabled={busy}
            onValueChange={(value) => set("category_id", value)}
            value={form.category_id}
          >
            <SelectTrigger className="w-full" id={id("category")}>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field htmlFor={id("description")} label="About">
          <textarea
            className={textareaClass}
            disabled={busy}
            id={id("description")}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What residents should know about this business"
            value={form.description}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>Media</SectionTitle>
        <Field htmlFor={id("logo")} label="Logo">
          <ImageField
            aspect={LOGO_ASPECT}
            currentUrl={current?.logo_url}
            disabled={busy}
            emptyLabel="Square image, at least 512×512."
            id={id("logo")}
            onChange={(next) => set("logo", next)}
            shape="square"
            value={form.logo}
          />
        </Field>
        <Field htmlFor={id("cover")} label="Cover photo">
          <ImageField
            aspect={COVER_ASPECT}
            currentUrl={current?.cover_photo_url}
            disabled={busy}
            emptyLabel="Wide 16:9 image shown at the top of the profile."
            id={id("cover")}
            onChange={(next) => set("cover", next)}
            shape="wide"
            value={form.cover}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>Contact</SectionTitle>
        <Field
          error={errors.email}
          hint="Optional for admin-posted listings — needed to send a claim invite."
          htmlFor={id("email")}
          label="Email"
        >
          <Input
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            disabled={busy}
            id={id("email")}
            inputMode="email"
            onChange={(e) => set("email", e.target.value)}
            placeholder="business@example.com"
            type="email"
            value={form.email}
          />
        </Field>
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2.5",
            busy && "cursor-not-allowed opacity-50",
          )}
          htmlFor={id("show-email")}
        >
          <input
            checked={form.show_email}
            className="mt-0.5 size-4 accent-foreground"
            disabled={busy}
            id={id("show-email")}
            onChange={(e) => set("show_email", e.target.checked)}
            type="checkbox"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              Show email publicly
            </span>
            <span className="text-xs text-muted-foreground">
              When off, the contact email is hidden from the public profile and
              flyers.
            </span>
          </span>
        </label>
        <Field htmlFor={id("phone")} label="Phone">
          <Input
            autoComplete="tel"
            disabled={busy}
            id={id("phone")}
            inputMode="tel"
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(555) 123-4567"
            type="tel"
            value={form.phone}
          />
        </Field>
        <Field error={errors.website} htmlFor={id("website")} label="Website">
          <Input
            aria-invalid={Boolean(errors.website)}
            autoComplete="url"
            disabled={busy}
            id={id("website")}
            inputMode="url"
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://example.com"
            type="url"
            value={form.website}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>Location</SectionTitle>
        <Field
          hint="Westchester County addresses only. Sets the map pin residents see."
          htmlFor={id("address")}
          label="Address"
        >
          <AddressField
            disabled={busy}
            fallbackAddress={form.location ? null : current?.address}
            id={id("address")}
            onChange={(location) => set("location", location)}
            value={form.location}
          />
        </Field>
        <Field
          hint="Auto-matched from the address when left blank."
          htmlFor={id("town")}
          label="Town"
        >
          <Select
            disabled={busy}
            onValueChange={(value) => set("town_id", value)}
            value={form.town_id}
          >
            <SelectTrigger className="w-full" id={id("town")}>
              <SelectValue placeholder="Choose a town" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TOWN}>No town</SelectItem>
              {towns.map((town) => (
                <SelectItem key={town.id} value={town.id}>
                  {town.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>Social profiles</SectionTitle>
        {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
          <Field
            error={errors[key]}
            htmlFor={id(`social-${key}`)}
            key={key}
            label={label}
          >
            <Input
              aria-invalid={Boolean(errors[key])}
              autoComplete="off"
              disabled={busy}
              id={id(`social-${key}`)}
              inputMode="url"
              onChange={(e) => setSocial(key, e.target.value)}
              placeholder={placeholder}
              type="url"
              value={form.social[key]}
            />
          </Field>
        ))}
      </section>
    </>
  );
}
