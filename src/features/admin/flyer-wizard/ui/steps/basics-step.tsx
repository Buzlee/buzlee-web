"use client";

/**
 * Step 1 — "What are you sharing?": flyer type, artwork, cover photo, title.
 */
import { Input } from "@/components/ui/input";
import { Field } from "@/features/admin/businesses/business-form";
import { revokeDraftUrl } from "../../lib/media";
import type { WizardStepProps } from "../../model/wizard-api";
import { FLYER_TYPE_COPY, stepCopy } from "../../model/wizard-steps";
import { ArtworkField } from "../components/artwork-field";
import { CoverPhotoField } from "../components/cover-photo-field";
import { FlyerTypeChoice } from "../components/flyer-type-choice";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";

export function BasicsStep({
  wizard,
  onPrimary,
  primaryLabel,
}: WizardStepProps) {
  const { draft, issues, actions } = wizard;
  const copy = stepCopy("basics", draft.flyerType, wizard.mode);

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
      <FlyerTypeChoice
        onChange={actions.setFlyerType}
        value={draft.flyerType}
      />

      <ArtworkField
        error={issues.media}
        id="flyer-artwork"
        media={draft.media}
        onChange={(media) => {
          revokeDraftUrl(draft.media?.file ? draft.media.uri : null);
          actions.patchDraft({ media, mediaChanged: true });
        }}
      />

      <CoverPhotoField
        coverPhoto={draft.coverPhoto}
        id="flyer-cover-photo"
        onChange={(coverPhoto) => {
          revokeDraftUrl(draft.coverPhoto?.file ? draft.coverPhoto.uri : null);
          actions.patchDraft({ coverPhoto, coverPhotoChanged: true });
        }}
      />

      <Field error={issues.title} htmlFor="flyer-title" label="Title *">
        <Input
          aria-invalid={Boolean(issues.title)}
          id="flyer-title"
          onChange={(e) => actions.patchDraft({ title: e.target.value })}
          placeholder={FLYER_TYPE_COPY[draft.flyerType].titlePlaceholder}
          value={draft.title}
        />
      </Field>
    </WizardShell>
  );
}
