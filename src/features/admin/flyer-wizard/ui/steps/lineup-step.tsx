"use client";

/**
 * Step 2 for multi-event flyers ("What's on the lineup?"): month calendar,
 * the selected day's agenda beside it, and the full event list. Renders the
 * add/edit event form when `wizard.lineupView` is not the list.
 */
import { useMemo } from "react";
import { expandOccurrenceStartDays } from "@/entities/flyer/lib/flyer-occurrences";
import { parseDateLocal } from "@/shared/lib/date-local";
import { eventColorClassAt } from "../../lib/event-colors";
import { formatLineupRange } from "../../lib/format-event-summary";
import { eventDraftToSchedule } from "../../lib/serialize-flyer-draft";
import type { EventDraft } from "../../model/types";
import type { WizardStepProps } from "../../model/wizard-api";
import { stepCopy } from "../../model/wizard-steps";
import {
  DayAgendaCard,
  type DayAgendaItem,
} from "../components/day-agenda-card";
import { SectionLabel } from "../components/event-form";
import { EventList } from "../components/event-list";
import { LineupCalendar } from "../components/lineup-calendar";
import { WizardFooter } from "../components/wizard-footer";
import { WizardShell } from "../wizard-shell";
import { EventFormStep } from "./event-form-step";

/** Events (with their lineup colour) that have an occurrence starting on `date`. */
export function agendaItemsFor(
  events: EventDraft[],
  date: string,
): DayAgendaItem[] {
  const day = parseDateLocal(date);
  const items: DayAgendaItem[] = [];
  events.forEach((event, index) => {
    if (!event.startDate) return;
    if (
      expandOccurrenceStartDays(eventDraftToSchedule(event), day, day)
        .length === 0
    )
      return;
    items.push({ event, colorClass: eventColorClassAt(index) });
  });
  return items;
}

export function LineupStep(props: WizardStepProps) {
  const { wizard, onPrimary, primaryLabel } = props;
  const copy = stepCopy("schedule", "multi", wizard.mode);
  const events = wizard.draft.events;
  const { visibleMonth, selectedDate } = wizard.state.calendar;

  const agendaItems = useMemo(
    () => (selectedDate ? agendaItemsFor(events, selectedDate) : []),
    [events, selectedDate],
  );

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
          <SectionLabel>Calendar</SectionLabel>
          <span className="text-xs text-muted-foreground">
            {formatLineupRange(events)}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
          <LineupCalendar
            className="rounded-lg border border-border [--cell-size:--spacing(10)]"
            events={events}
            onMonthChange={wizard.actions.setVisibleMonth}
            onSelectDate={wizard.actions.selectDate}
            selectedDate={selectedDate}
            visibleMonth={visibleMonth}
          />
          {selectedDate ? (
            <DayAgendaCard
              date={selectedDate}
              items={agendaItems}
              onAddEvent={wizard.actions.openAddEvent}
              onSelectEvent={wizard.actions.openEditEvent}
            />
          ) : (
            <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground md:self-stretch">
              Pick a day to see what's on, or add an event on that date.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <SectionLabel>All events</SectionLabel>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {events.length}
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
