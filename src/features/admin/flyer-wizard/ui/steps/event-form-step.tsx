"use client";

/**
 * Step 2 sub-view for multi-event flyers: add a new event or edit an existing
 * one. The form is a local copy of the event; the wizard only receives it on
 * submit (`submitEvent`), so cancelling never touches the draft.
 */
import { useCallback, useMemo, useState } from "react";
import { eventColorClassAt } from "../../lib/event-colors";
import { formatDisplayDate } from "../../lib/format-event-summary";
import { validateEventDraft } from "../../lib/validate-wizard-step";
import { createEmptyEventDraft } from "../../model/create-flyer-draft";
import type { EventDraft, LineupView, StepIssues } from "../../model/types";
import type { WizardStepProps } from "../../model/wizard-api";
import { EventForm } from "../components/event-form";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";

const EVENT_VALIDATION = { requireTitle: true, requireUntil: true } as const;

/** Identity of the open form; a change re-seeds the local copy. */
function lineupViewKey(view: LineupView): string {
  switch (view.kind) {
    case "edit":
      return `edit:${view.localId}`;
    case "add":
      return `add:${view.prefillDate ?? ""}`;
    default:
      return "list";
  }
}

function seedEvent(view: LineupView, editing: EventDraft | null): EventDraft {
  if (editing) return editing;
  return createEmptyEventDraft({
    startDate: view.kind === "add" ? (view.prefillDate ?? "") : "",
  });
}

export function EventFormStep({ wizard }: WizardStepProps) {
  const { lineupView, editingEvent, draft } = wizard;
  const isEdit = lineupView.kind === "edit";
  const viewKey = lineupViewKey(lineupView);

  const [seedKey, setSeedKey] = useState(viewKey);
  const [local, setLocal] = useState<EventDraft>(() =>
    seedEvent(lineupView, editingEvent),
  );
  const [attempted, setAttempted] = useState(false);

  // Re-seed synchronously when the wizard opens a different event (React's
  // "adjust state on prop change" pattern — avoids a frame of stale fields).
  if (seedKey !== viewKey) {
    setSeedKey(viewKey);
    setLocal(seedEvent(lineupView, editingEvent));
    setAttempted(false);
  }

  const patchLocal = useCallback((patch: Partial<EventDraft>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
  }, []);

  // Once submitted, errors follow the live local copy; before that the wizard's
  // own event issues (empty until `markEventFormAttempted`) are shown.
  const localIssues = useMemo<StepIssues>(
    () => (attempted ? validateEventDraft(local, EVENT_VALIDATION) : {}),
    [attempted, local],
  );
  const issues: StepIssues = attempted ? localIssues : wizard.eventIssues;

  const eventIndex = isEdit
    ? draft.events.findIndex((e) => e.localId === local.localId)
    : -1;
  const colorIndex = eventIndex >= 0 ? eventIndex : draft.events.length;

  const flyerName = draft.title.trim() || "this flyer";
  const subtitle = isEdit
    ? `${local.title.trim() || "Untitled event"} · Part of ${flyerName}`
    : local.startDate
      ? `Part of ${flyerName}. Starts ${formatDisplayDate(local.startDate)} — change anything below.`
      : `Part of ${flyerName}. Set the date, time and repeat rule below.`;

  const submit = (then: "list" | "another") => {
    wizard.actions.markEventFormAttempted();
    setAttempted(true);
    const accepted = wizard.actions.submitEvent(local, then);
    if (accepted && then === "another") {
      setLocal(createEmptyEventDraft());
      setAttempted(false);
    }
    wizard.scrollRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const footer = isEdit ? (
    <WizardFooter
      destructiveLink={{
        label: "Remove from lineup",
        onClick: () => wizard.actions.removeEvent(local.localId),
      }}
      primary={{ label: "Save event", onClick: () => submit("list") }}
    />
  ) : (
    <WizardFooter
      primary={{ label: "Add to lineup", onClick: () => submit("list") }}
      secondary={{
        label: "Add & start another",
        onClick: () => submit("another"),
      }}
    />
  );

  return (
    <WizardShell
      backLabel="Back to lineup"
      footer={footer}
      onBack={wizard.actions.closeEventForm}
      rightAction={{
        label: "Cancel",
        onClick: wizard.actions.closeEventForm,
        tone: "muted",
      }}
      scrollRef={wizard.scrollRef}
      stepIndex={wizard.stepIndex}
      stepLabel={`Step ${wizard.stepIndex + 1} of ${wizard.totalSteps} · ${isEdit ? "Edit event" : "New event"}`}
      subtitle={subtitle}
      title={isEdit ? "Edit event" : "Add an event"}
      totalSteps={wizard.totalSteps}
    >
      <EventForm
        colorClass={eventColorClassAt(colorIndex)}
        issues={issues}
        onChange={patchLocal}
        value={local}
      />
    </WizardShell>
  );
}
