"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminUpdateBusiness } from "@/entities/admin";
import { useBusiness } from "@/entities/business/api/use-business";
import type {
  BusinessUpdate,
  BusinessWithDetails,
  SocialLinks,
} from "@/entities/business/model/types";
import { useBusinessCategories, useTowns } from "@/entities/catalog";
import { cn } from "@/lib/utils";

/** Radix Select cannot represent an empty-string value; sentinel for "no town". */
const NO_TOWN = "__none__";

const SOCIAL_FIELDS: {
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

type FormState = {
  name: string;
  category_id: string;
  description: string;
  email: string;
  show_email: boolean;
  phone: string;
  website: string;
  address: string;
  town_id: string;
  social: Record<keyof SocialLinks, string>;
};

function formFromBusiness(business: BusinessWithDetails): FormState {
  const social = (business.social_links as SocialLinks | null) ?? {};
  return {
    name: business.name,
    category_id: business.category_id,
    description: business.description ?? "",
    email: business.email ?? "",
    show_email: business.show_email !== false,
    phone: business.phone ?? "",
    website: business.website ?? "",
    address: business.address ?? "",
    town_id: business.town_id ?? NO_TOWN,
    social: {
      facebook: social.facebook ?? "",
      instagram: social.instagram ?? "",
      yelp: social.yelp ?? "",
      google_business: social.google_business ?? "",
    },
  };
}

function nullable(value: string): string | null {
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

/**
 * Diff the edited form against the saved row, returning only changed
 * columns so an unrelated concurrent edit (e.g. from the mobile app) is not
 * clobbered by stale values.
 */
function buildPatch(initial: FormState, current: FormState): BusinessUpdate {
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
  if (nullable(current.address) !== nullable(initial.address))
    patch.address = nullable(current.address);
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

function Field({
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

const textareaClass =
  "min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

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
  const [form, setForm] = useState<FormState>(initial);
  const { data: categories = [] } = useBusinessCategories();
  const { data: towns = [] } = useTowns();
  const update = useAdminUpdateBusiness(business.id);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setSocial(key: keyof SocialLinks, value: string) {
    setForm((prev) => ({ ...prev, social: { ...prev.social, [key]: value } }));
  }

  const patch = buildPatch(initial, form);
  const dirty = Object.keys(patch).length > 0;

  const errors: Partial<Record<string, string>> = {};
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
  const valid = Object.keys(errors).length === 0;
  const canSave = dirty && valid && !update.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    update.mutate(patch, {
      onSuccess: () => {
        toast.success(`Saved changes to ${form.name.trim()}`);
        onDone();
      },
      onError: (error) => toast.error(`Save failed: ${error.message}`),
    });
  }

  const busy = update.isPending;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
        <section className="flex flex-col gap-4">
          <SectionTitle>Listing</SectionTitle>
          <Field error={errors.name} htmlFor="edit-name" label="Business name">
            <Input
              aria-invalid={Boolean(errors.name)}
              autoComplete="organization"
              disabled={busy}
              id="edit-name"
              onChange={(e) => set("name", e.target.value)}
              value={form.name}
            />
          </Field>
          <Field
            error={errors.category_id}
            htmlFor="edit-category"
            label="Category"
          >
            <Select
              disabled={busy}
              onValueChange={(value) => set("category_id", value)}
              value={form.category_id}
            >
              <SelectTrigger className="w-full" id="edit-category">
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
          <Field htmlFor="edit-description" label="About">
            <textarea
              className={textareaClass}
              disabled={busy}
              id="edit-description"
              onChange={(e) => set("description", e.target.value)}
              placeholder="What residents should know about this business"
              value={form.description}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle>Contact</SectionTitle>
          <Field error={errors.email} htmlFor="edit-email" label="Email">
            <Input
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              disabled={busy}
              id="edit-email"
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
            htmlFor="edit-show-email"
          >
            <input
              checked={form.show_email}
              className="mt-0.5 size-4 accent-foreground"
              disabled={busy}
              id="edit-show-email"
              onChange={(e) => set("show_email", e.target.checked)}
              type="checkbox"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Show email publicly
              </span>
              <span className="text-xs text-muted-foreground">
                When off, the contact email is hidden from the public profile
                and flyers.
              </span>
            </span>
          </label>
          <Field htmlFor="edit-phone" label="Phone">
            <Input
              autoComplete="tel"
              disabled={busy}
              id="edit-phone"
              inputMode="tel"
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 123-4567"
              type="tel"
              value={form.phone}
            />
          </Field>
          <Field error={errors.website} htmlFor="edit-website" label="Website">
            <Input
              aria-invalid={Boolean(errors.website)}
              autoComplete="url"
              disabled={busy}
              id="edit-website"
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
            hint="Updates the displayed address only. The map pin is set from the mobile app's address picker."
            htmlFor="edit-address"
            label="Address"
          >
            <Input
              autoComplete="street-address"
              disabled={busy}
              id="edit-address"
              onChange={(e) => set("address", e.target.value)}
              placeholder="123 Main St, Town, NY"
              value={form.address}
            />
          </Field>
          <Field htmlFor="edit-town" label="Town">
            <Select
              disabled={busy}
              onValueChange={(value) => set("town_id", value)}
              value={form.town_id}
            >
              <SelectTrigger className="w-full" id="edit-town">
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
              htmlFor={`edit-social-${key}`}
              key={key}
              label={label}
            >
              <Input
                aria-invalid={Boolean(errors[key])}
                autoComplete="off"
                disabled={busy}
                id={`edit-social-${key}`}
                inputMode="url"
                onChange={(e) => setSocial(key, e.target.value)}
                placeholder={placeholder}
                type="url"
                value={form.social[key]}
              />
            </Field>
          ))}
        </section>
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
 * Mirrors the field set of buzlee-app's admin edit-business screen, minus
 * logo/cover uploads and the geocoded address picker (mobile-only).
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
