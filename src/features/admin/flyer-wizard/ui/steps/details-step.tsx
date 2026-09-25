"use client";

/**
 * Step 3 — "Tell people more": description, category, tags, age restriction.
 */
import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  textareaClass,
} from "@/features/admin/businesses/business-form";
import type { AgeRestrictionDraft } from "../../model/types";
import type { WizardStepProps } from "../../model/wizard-api";
import { stepCopy } from "../../model/wizard-steps";
import { AgeRestrictionFields } from "../components/age-restriction-fields";
import { ChoiceChips } from "../components/choice-chips";
import { TagSelector } from "../components/tag-selector";
import { ToggleRow } from "../components/toggle-row";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";

const MAX_TAGS = 5;

export function DetailsStep({
  wizard,
  categories,
  onPrimary,
  primaryLabel,
}: WizardStepProps) {
  const { draft, issues, actions } = wizard;
  const copy = stepCopy("details", draft.flyerType, wizard.mode);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories],
  );

  const patchAge = (patch: Partial<AgeRestrictionDraft>) => {
    actions.patchDraft({
      ageRestriction: { ...draft.ageRestriction, ...patch },
    });
  };

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
      <Field htmlFor="flyer-description" label="Description">
        <textarea
          className={textareaClass}
          id="flyer-description"
          onChange={(e) => actions.patchDraft({ description: e.target.value })}
          placeholder="Provide more details about your event…"
          value={draft.description}
        />
      </Field>

      <Field
        error={issues.categoryId}
        htmlFor="flyer-category"
        label="Category *"
      >
        <ChoiceChips
          aria-label="Category"
          onChange={(categoryId) => actions.patchDraft({ categoryId })}
          options={categoryOptions}
          value={draft.categoryId || null}
        />
      </Field>

      <Field
        hint="Pick a few tags so people can find the event."
        htmlFor="flyer-tags"
        label="Tags"
      >
        <TagSelector
          maxTags={MAX_TAGS}
          onTagsChange={(tagIds) => actions.patchDraft({ tagIds })}
          selectedTagIds={draft.tagIds}
        />
      </Field>

      <Separator />

      <div className="flex flex-col gap-4">
        <ToggleRow
          checked={draft.ageRestriction.enabled}
          label="Age restricted event"
          onCheckedChange={(enabled) => patchAge({ enabled })}
        />
        {draft.ageRestriction.enabled ? (
          <AgeRestrictionFields
            issues={issues}
            onChange={patchAge}
            value={draft.ageRestriction}
          />
        ) : null}
      </div>
    </WizardShell>
  );
}
