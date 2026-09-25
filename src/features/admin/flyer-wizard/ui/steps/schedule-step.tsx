"use client";

/**
 * Step 2 for single-event flyers ("When is it happening?"): stacked schedule
 * fields for `draft.events[0]` plus a nudge to switch to a multi-event lineup.
 */
import { Calendar } from "lucide-react";
import { useMemo } from "react";
import { createEmptyEventDraft } from "../../model/create-flyer-draft";
import type { WizardStepProps } from "../../model/wizard-api";
import { stepCopy } from "../../model/wizard-steps";
import { EventScheduleFields } from "../components/event-schedule-fields";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";

export function ScheduleStep({
  wizard,
  onPrimary,
  primaryLabel,
}: WizardStepProps) {
  const copy = stepCopy("schedule", "single", wizard.mode);
  const existing = wizard.draft.events[0];
  // Single flyers always carry one event; the fallback only guards a malformed draft.
  const fallback = useMemo(() => createEmptyEventDraft(), []);
  const event = existing ?? fallback;

  return (
    <WizardShell
      footer={
        <WizardFooter primary={{ label: primaryLabel, onClick: onPrimary }} />
      }
      onBack={wizard.actions.back}
      scrollRef={wizard.scrollRef}
      stepIndex={wizard.stepIndex}
      subtitle={copy.subtitle}
      title={copy.title}
      totalSteps={wizard.totalSteps}
    >
      <EventScheduleFields
        idPrefix="schedule"
        issues={wizard.issues}
        layout="stacked"
        onChange={wizard.actions.patchSingleEvent}
        untilMode="optional"
        value={event}
      />

      <div className="flex gap-3 rounded-lg bg-muted p-4">
        <Calendar className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            Running a series or a festival week?
          </p>
          <p className="text-sm text-muted-foreground">
            Bundle several events into one flyer, each with its own dates and
            times.
          </p>
          <button
            className="mt-1 self-start text-sm font-semibold text-accent-foreground hover:underline"
            onClick={() => wizard.actions.setFlyerType("multi")}
            type="button"
          >
            Switch to multiple events
          </button>
        </div>
      </div>
    </WizardShell>
  );
}
