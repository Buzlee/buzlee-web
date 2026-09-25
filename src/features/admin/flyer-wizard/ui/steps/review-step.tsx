"use client";

import {
  AlignLeft,
  Calendar,
  ImageIcon,
  type LucideIcon,
  MapPin,
} from "lucide-react";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import { StatusChip } from "@/features/admin/shell/status-chip";
import { formatLiveSubtitle } from "../../lib/format-event-summary";
import type { SectionKey } from "../../model/types";
import type { FlyerWizardApi } from "../../model/wizard-api";
import { stepCopy } from "../../model/wizard-steps";
import { FlyerPreviewCard } from "../components/flyer-preview-card";
import { ReviewSectionRow } from "../components/review-section-row";
import { VisibilityChoice } from "../components/visibility-choice";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";

const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
  flyer: ImageIcon,
  schedule: Calendar,
  details: AlignLeft,
  location: MapPin,
};

export type ReviewStepSubmit = {
  submitting: boolean;
  publish: () => Promise<void>;
  saveDraft: () => Promise<void>;
  saveChanges: () => Promise<void>;
};

/**
 * Step 5. Two variants sharing one layout:
 *  - `review`: create flow / editing a draft → Publish flyer · Save as draft
 *  - `live`:   editing a live flyer (the "Edit hub") → Save changes · Unpublish · Delete flyer
 * Section rows jump to their step with `returnTo: 'hub'` so "Done" comes back here.
 */
export function ReviewStep({
  wizard,
  businessId,
  categories,
  submit,
  onUnpublish,
  onDelete,
  onPreview,
  statusBusy = false,
}: {
  wizard: FlyerWizardApi;
  businessId: string;
  categories: { id: string; name: string }[];
  submit: ReviewStepSubmit;
  /** Live hub only */
  onUnpublish?: (flyer: FlyerWithDetails) => void;
  onDelete?: (flyer: FlyerWithDetails) => void;
  onPreview?: () => void;
  statusBusy?: boolean;
}) {
  const {
    draft,
    existingFlyer,
    hubVariant,
    sectionStatuses,
    isPublishable,
    isDirty,
  } = wizard;
  const isLive = hubVariant === "live" && !!existingFlyer;
  const copy = stepCopy("review", draft.flyerType, wizard.mode);
  const categoryName = categories.find((c) => c.id === draft.categoryId)?.name;
  const busy = submit.submitting || statusBusy;

  const footer = isLive ? (
    <WizardFooter
      destructiveLink={{
        label: "Delete flyer",
        onClick: () => existingFlyer && onDelete?.(existingFlyer),
        disabled: busy,
      }}
      primary={{
        label: "Save changes",
        onClick: () => void submit.saveChanges(),
        disabled: !isDirty || !isPublishable || busy,
        loading: submit.submitting,
      }}
      secondary={{
        label: "Unpublish",
        onClick: () => existingFlyer && onUnpublish?.(existingFlyer),
        disabled: busy,
      }}
    />
  ) : (
    <WizardFooter
      finePrint="You can edit or unpublish anytime."
      primary={{
        label: "Publish flyer",
        onClick: () => void submit.publish(),
        disabled: !isPublishable || busy,
        loading: submit.submitting,
      }}
      secondary={{
        label: wizard.mode === "edit" ? "Save draft" : "Save as draft",
        onClick: () => void submit.saveDraft(),
        disabled: !isPublishable || busy,
      }}
    />
  );

  return (
    <WizardShell
      centerSlot={isLive ? <StatusChip variant="live" /> : undefined}
      footer={footer}
      hideProgress={isLive}
      onBack={wizard.actions.back}
      rightAction={
        isLive && onPreview
          ? { label: "View flyer", onClick: onPreview }
          : undefined
      }
      scrollRef={wizard.scrollRef}
      stepIndex={wizard.stepIndex}
      subtitle={
        isLive && existingFlyer
          ? formatLiveSubtitle(existingFlyer)
          : copy.subtitle
      }
      title={isLive ? "Edit flyer" : copy.title}
      totalSteps={wizard.totalSteps}
    >
      <FlyerPreviewCard categoryName={categoryName} draft={draft} />

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
        {sectionStatuses.map((section) => (
          <ReviewSectionRow
            complete={section.complete}
            disabled={busy}
            icon={SECTION_ICONS[section.key]}
            key={section.key}
            onClick={() =>
              wizard.actions.jumpTo(section.step, { returnTo: "hub" })
            }
            summary={section.summary}
            title={section.title}
          />
        ))}
      </div>

      {!isPublishable ? (
        <p className="text-xs text-destructive">
          Finish the sections marked with a warning before publishing.
        </p>
      ) : null}

      <VisibilityChoice
        businessId={businessId}
        disabled={busy}
        onChange={(visibility) => wizard.actions.patchDraft({ visibility })}
        value={draft.visibility}
      />
    </WizardShell>
  );
}
