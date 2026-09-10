"use client";

/**
 * Step 4 — "Where is it?": address (with business-address shortcut),
 * optional location name and external link.
 */
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  composeAddressWithUnit,
  type GeocodedLocation,
} from "@/entities/location";
import { Field } from "@/features/admin/businesses/business-form";
import { AddressField } from "@/features/admin/components/address-field";
import type { WizardStepProps } from "../../model/wizard-api";
import { stepCopy } from "../../model/wizard-steps";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";

/** Same identity check as the app's location step. */
export function isSameLocation(
  a: GeocodedLocation | null | undefined,
  b: GeocodedLocation | null | undefined,
): boolean {
  return (
    !!a &&
    !!b &&
    a.lat === b.lat &&
    a.lng === b.lng &&
    a.formatted_address === b.formatted_address
  );
}

export function LocationStep({
  wizard,
  businessLocation,
  onPrimary,
  primaryLabel,
}: WizardStepProps) {
  const { draft, issues, actions } = wizard;
  const copy = stepCopy("location", draft.flyerType, wizard.mode);
  const businessAddressApplied = isSameLocation(
    draft.location,
    businessLocation,
  );

  return (
    <WizardShell
      footer={
        <WizardFooter primary={{ label: primaryLabel, onClick: onPrimary }} />
      }
      onBack={actions.back}
      scrollRef={wizard.scrollRef}
      stepIndex={wizard.stepIndex}
      subtitle={copy.subtitle}
      title={copy.title}
      totalSteps={wizard.totalSteps}
    >
      <Field
        error={issues.location}
        hint="Westchester County addresses only. Sets the map pin residents see."
        htmlFor="flyer-address"
        label="Address *"
      >
        <AddressField
          id="flyer-address"
          onChange={(location) => actions.patchDraft({ location })}
          value={draft.location}
        />
      </Field>

      {businessLocation && !businessAddressApplied ? (
        <Button
          className="self-start"
          onClick={() => actions.patchDraft({ location: businessLocation })}
          size="sm"
          type="button"
          variant="outline"
        >
          <MapPin />
          Use business address
        </Button>
      ) : null}

      {draft.location ? (
        <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          <span className="min-w-0 truncate">
            {composeAddressWithUnit(
              draft.location.formatted_address,
              draft.location.unit,
            )}
            {draft.location.town_name ? ` · ${draft.location.town_name}` : ""}
          </span>
        </div>
      ) : null}

      <Field htmlFor="flyer-location-name" label="Location name (optional)">
        <Input
          id="flyer-location-name"
          onChange={(e) => actions.patchDraft({ locationName: e.target.value })}
          placeholder="e.g., Main Street Park, Your Business Name"
          value={draft.locationName}
        />
      </Field>

      <Field
        error={issues.externalLink}
        hint="Add tickets, registration, or more info."
        htmlFor="flyer-external-link"
        label="External link (optional)"
      >
        <Input
          aria-invalid={Boolean(issues.externalLink)}
          id="flyer-external-link"
          inputMode="url"
          onChange={(e) => actions.patchDraft({ externalLink: e.target.value })}
          placeholder="https://example.com/event"
          type="url"
          value={draft.externalLink}
        />
      </Field>
    </WizardShell>
  );
}
