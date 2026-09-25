"use client";

// Web port of buzlee-app's `FlyerWizardScreen` (admin variant only). RN
// Alerts become toasts + the promise-based confirm dialog; there is no local
// draft resume on the web (drafts live in memory for the page's lifetime).
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { BusinessStatus } from "@/entities/business/model/types";
import { useFlyerCategories } from "@/entities/catalog";
import {
  deleteFlyerAndTrack,
  isFlyerEventPast,
  unpublishFlyer,
} from "@/entities/flyer/api/flyer-status-mutations";
import { useFlyer, useFlyerTags } from "@/entities/flyer/api/use-flyer";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import type { GeocodedLocation } from "@/entities/location";
import { useConfirm } from "@/features/admin/dialogs/use-confirm";
import { useFlyerWizard } from "../model/use-flyer-wizard";
import { useFlyerWizardSubmit } from "../model/use-flyer-wizard-submit";
import type { FlyerWizardApi, WizardStepProps } from "../model/wizard-api";
import { stepCopy } from "../model/wizard-steps";
import { BasicsStep } from "./steps/basics-step";
import { DetailsStep } from "./steps/details-step";
import { EventFormStep } from "./steps/event-form-step";
import { LineupStep } from "./steps/lineup-step";
import { LocationStep } from "./steps/location-step";
import { ReviewStep } from "./steps/review-step";
import { ScheduleStep } from "./steps/schedule-step";

type Props = {
  businessId: string;
  businessStatus: BusinessStatus;
  businessName?: string;
  businessLocation?: GeocodedLocation | null;
  /** Edit mode when set. */
  flyerId?: string;
  /** After a successful save / unpublish / delete. */
  onDismissSuccess: () => void;
  /** Back / cancel out of the wizard (the hook confirms when dirty). */
  onCancel: () => void;
  /** Live edit hub: open the read-only flyer view. */
  onPreview?: (flyer: FlyerWithDetails) => void;
};

type SessionProps = Omit<Props, "flyerId"> & {
  existingFlyer: FlyerWithDetails | null;
  flyerTagIds: string[];
};

function CenteredMessage({ children }: { children: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-center text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

type StatusAction = "moveToDraft" | "delete";

function FlyerWizardSession({
  businessId,
  businessStatus,
  businessName,
  businessLocation,
  existingFlyer,
  flyerTagIds,
  onDismissSuccess,
  onCancel,
  onPreview,
}: SessionProps) {
  const queryClient = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const { data: categoriesData, isLoading: categoriesLoading } =
    useFlyerCategories();
  const categories = useMemo(
    () => (categoriesData ?? []).map((c) => ({ id: c.id, name: c.name })),
    [categoriesData],
  );
  const mode = existingFlyer ? "edit" : "create";
  const [busyAction, setBusyAction] = useState<StatusAction | null>(null);

  const wizard: FlyerWizardApi = useFlyerWizard({
    mode,
    businessId,
    existingFlyer,
    existingTagIds: flyerTagIds,
    categories,
    onExit: onCancel,
    confirm,
  });

  const submit = useFlyerWizardSubmit({
    mode,
    businessId,
    existingFlyer,
    draft: wizard.draft,
    onSuccess: (message) => {
      toast.success(message);
      wizard.actions.markSaved();
      onDismissSuccess();
    },
    onError: (message) => toast.error(message),
  });

  // Unpublish / Delete from the hub leave the screen (the app's
  // `useFlyerStatusActions`, with Alert copy moved into the confirm dialog).
  async function runStatusAction(
    action: StatusAction,
    mutate: () => Promise<void>,
    successMessage: string,
  ) {
    if (busyAction) return;
    setBusyAction(action);
    try {
      await mutate();
      toast.success(successMessage);
      wizard.actions.markSaved();
      onDismissSuccess();
    } catch (error) {
      console.error(
        action === "delete" ? "[DeleteFlyer] Error:" : "[MoveToDraft] Error:",
        error,
      );
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : action === "delete"
            ? "Failed to delete flyer"
            : "Failed to move flyer to draft",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleUnpublish(flyer: FlyerWithDetails) {
    const past = isFlyerEventPast(flyer);
    const ok = await confirm({
      title: past ? "Event date has passed" : "Move to draft",
      description: past
        ? `The event date for “${flyer.title}” has already passed. You'll need to update the event date before you can publish it again. Move to draft anyway?`
        : `Move “${flyer.title}” back to draft? It can be published again later.`,
      ctaLabel: "Move to draft",
    });
    if (!ok) return;
    await runStatusAction(
      "moveToDraft",
      async () => {
        await unpublishFlyer(queryClient, flyer);
      },
      "Flyer moved to draft",
    );
  }

  async function handleDelete(flyer: FlyerWithDetails) {
    const ok = await confirm({
      title: "Delete flyer",
      description: `Are you sure you want to delete “${flyer.title}”? This action cannot be undone.`,
      ctaLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await runStatusAction(
      "delete",
      async () => {
        await deleteFlyerAndTrack(queryClient, flyer);
      },
      "Flyer deleted",
    );
  }

  if (categoriesLoading) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (businessStatus !== "approved") {
    return (
      <CenteredMessage>
        Flyers can only be created for approved businesses.
      </CenteredMessage>
    );
  }

  const fromHub = wizard.state.returnTo === "hub";
  const copy = stepCopy(wizard.step, wizard.draft.flyerType, mode);
  const stepProps: WizardStepProps = {
    wizard,
    categories,
    businessName,
    businessLocation,
    onPrimary: fromHub ? wizard.actions.done : wizard.actions.next,
    primaryLabel: fromHub ? "Done" : copy.primaryLabel,
  };

  let body: React.ReactNode;
  switch (wizard.step) {
    case "basics":
      body = <BasicsStep {...stepProps} />;
      break;
    case "schedule":
      if (wizard.draft.flyerType === "multi") {
        body =
          wizard.lineupView.kind === "list" ? (
            <LineupStep {...stepProps} />
          ) : (
            <EventFormStep {...stepProps} />
          );
      } else {
        body = <ScheduleStep {...stepProps} />;
      }
      break;
    case "details":
      body = <DetailsStep {...stepProps} />;
      break;
    case "location":
      body = <LocationStep {...stepProps} />;
      break;
    case "review":
      body = (
        <ReviewStep
          businessId={businessId}
          categories={categories}
          onDelete={(flyer) => void handleDelete(flyer)}
          onPreview={
            existingFlyer && onPreview
              ? () => onPreview(existingFlyer)
              : undefined
          }
          onUnpublish={(flyer) => void handleUnpublish(flyer)}
          statusBusy={busyAction !== null}
          submit={submit}
          wizard={wizard}
        />
      );
      break;
  }

  return (
    <>
      {body}
      {dialog}
    </>
  );
}

/**
 * Entry point for the create / edit flyer wizard. Resolves the flyer (edit),
 * guards ownership / approval, and keys the inner session so switching
 * flyers remounts the wizard.
 */
export function FlyerWizardScreen({
  businessId,
  businessStatus,
  businessName,
  businessLocation,
  flyerId,
  onDismissSuccess,
  onCancel,
  onPreview,
}: Props) {
  const resolvedFlyerId = flyerId ?? "";
  const isEditMode = !!resolvedFlyerId;
  const {
    data: fetchedFlyer,
    isLoading: flyerLoading,
    error,
  } = useFlyer(resolvedFlyerId);
  const {
    data: flyerTagsData = [],
    isLoading: tagsLoading,
    error: tagsError,
  } = useFlyerTags(resolvedFlyerId);

  const existingFlyer = isEditMode ? (fetchedFlyer ?? null) : null;
  const flyerTagIds = useMemo(
    () => flyerTagsData.map((tag) => tag.id),
    [flyerTagsData],
  );

  // The session seeds its draft once from `flyerTagIds`, so it must not mount
  // until the tags query has settled — a cached flyer would otherwise start
  // the draft with no tags and Save would wipe them.
  if (isEditMode && (flyerLoading || tagsLoading)) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }
  if (isEditMode && error)
    return <CenteredMessage>Failed to load flyer.</CenteredMessage>;
  if (isEditMode && tagsError)
    return <CenteredMessage>Failed to load flyer tags.</CenteredMessage>;
  if (isEditMode && !existingFlyer)
    return <CenteredMessage>Flyer not found.</CenteredMessage>;
  if (isEditMode && existingFlyer && existingFlyer.business_id !== businessId) {
    return (
      <CenteredMessage>
        This flyer does not belong to the selected business.
      </CenteredMessage>
    );
  }

  const sessionKey = isEditMode
    ? `edit:${existingFlyer?.id}`
    : `create:${businessId}`;

  return (
    <FlyerWizardSession
      businessId={businessId}
      businessLocation={businessLocation}
      businessName={businessName}
      businessStatus={businessStatus}
      existingFlyer={existingFlyer}
      flyerTagIds={flyerTagIds}
      key={sessionKey}
      onCancel={onCancel}
      onDismissSuccess={onDismissSuccess}
      onPreview={onPreview}
    />
  );
}
