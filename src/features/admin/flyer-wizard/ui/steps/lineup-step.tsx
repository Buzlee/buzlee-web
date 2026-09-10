"use client";

/**
 * Step 2 for multi-event flyers ("What's on the lineup?"): the full event
 * list. Renders the add/edit event form when `wizard.lineupView` is not the
 * list. (The app also shows a month calendar; the web lists events only.)
 */
import { formatLineupRange } from "../../lib/format-event-summary";
import type { WizardStepProps } from "../../model/wizard-api";
import { stepCopy } from "../../model/wizard-steps";
import { SectionLabel } from "../components/event-form";
import { EventList } from "../components/event-list";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";
import { EventFormStep } from "./event-form-step";

export function LineupStep(props: WizardStepProps) {
  const { wizard, onPrimary, primaryLabel } = props;
  const copy = stepCopy("schedule", "multi", wizard.mode);
  const events = wizard.draft.events;

  if (wizard.lineupView.kind !== "list") {
    return <EventFormStep {...props} />;
  }

  return (
    <WizardShell
      footer={
        <WizardFooter
          primary={{
            label: primaryLabel,
            onClick: onPrimary,
            disabled: !wizard.canContinue,
          }}
        />
      }
      onBack={wizard.actions.back}
      scrollRef={wizard.scrollRef}
      stepIndex={wizard.stepIndex}
      subtitle={copy.subtitle}
      title={copy.title}
      totalSteps={wizard.totalSteps}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SectionLabel>All events</SectionLabel>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {events.length}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatLineupRange(events)}
          </span>
        </div>
        {wizard.issues.events ? (
          <p className="text-xs text-destructive">{wizard.issues.events}</p>
        ) : null}
        <EventList
          events={events}
          onAddEvent={() => wizard.actions.openAddEvent()}
          onSelectEvent={wizard.actions.openEditEvent}
        />
      </div>
    </WizardShell>
  );
}
