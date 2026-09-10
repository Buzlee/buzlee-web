// PORTED FROM buzlee-app/src/features/flyer-wizard/model/wizard-reducer.ts — keep in sync; see docs/admin-sync.md
import { combineDateAndTime } from "@/entities/flyer/lib/flyer-datetime";
import { monthKey, parseDateLocal } from "@/shared/lib/date-local";
import { createEmptyEventDraft } from "./create-flyer-draft";
import type {
  EventDraft,
  FlyerDraft,
  FlyerType,
  LineupView,
  WizardState,
  WizardStep,
} from "./types";
import { stepAfter, stepBefore } from "./wizard-steps";

export type WizardAction =
  | { type: "patchDraft"; patch: Partial<FlyerDraft> }
  | { type: "setFlyerType"; flyerType: FlyerType }
  | { type: "patchSingleEvent"; patch: Partial<EventDraft> }
  | { type: "upsertEvent"; event: EventDraft }
  | { type: "removeEvent"; localId: string }
  | { type: "setLineupView"; view: LineupView }
  | { type: "selectDate"; date: string | null }
  | { type: "setVisibleMonth"; month: string }
  | { type: "next" }
  | { type: "back" }
  | { type: "jumpTo"; step: WizardStep; returnTo?: "hub" | null }
  | { type: "markAttempted"; step: WizardStep }
  | { type: "hydrate"; state: Partial<WizardState> }
  | { type: "reset"; state: WizardState };

const LIST_VIEW: LineupView = { kind: "list" };

/** Sortable start instant (callers only compare dated events). */
function startInstant(event: EventDraft): string {
  return combineDateAndTime(event.startDate, event.startTime);
}

function isBlankEvent(event: EventDraft): boolean {
  return (
    !event.startDate &&
    !event.startTime &&
    !event.endDate &&
    !event.endTime &&
    !event.title.trim() &&
    !event.description.trim()
  );
}

/** single ⇒ exactly one event; multi ⇒ any number. */
export function enforceFlyerTypeInvariant(draft: FlyerDraft): FlyerDraft {
  if (draft.flyerType === "multi") return draft;
  if (draft.events.length === 1) return draft;
  if (draft.events.length === 0)
    return { ...draft, events: [createEmptyEventDraft()] };
  return { ...draft, events: [draft.events[0]] };
}

function switchFlyerType(draft: FlyerDraft, flyerType: FlyerType): FlyerDraft {
  if (draft.flyerType === flyerType) return draft;

  if (flyerType === "multi") {
    // Keep the single event as the first lineup entry, naming it after the
    // flyer when it has no title of its own. A pristine empty event is dropped
    // so the lineup does not start with an invalid "Untitled" row.
    const events = draft.events
      .filter((event, index) => !(index === 0 && isBlankEvent(event)))
      .map((event, index) =>
        index === 0 && !event.title.trim()
          ? { ...event, title: draft.title }
          : event,
      );
    return { ...draft, flyerType, events };
  }

  // multi → single: keep the earliest-starting dated event, else the first,
  // else start fresh.
  const dated = draft.events.filter((event) => !!event.startDate);
  const pool = dated.length > 0 ? dated : draft.events;
  const keep = [...pool].sort((a, b) =>
    startInstant(a).localeCompare(startInstant(b)),
  )[0];
  const event = keep ?? createEmptyEventDraft();
  const title = draft.title.trim() ? draft.title : event.title;
  return { ...draft, flyerType, title, events: [event] };
}

function withDraft(state: WizardState, draft: FlyerDraft): WizardState {
  const next = enforceFlyerTypeInvariant(draft);
  return next === state.draft ? state : { ...state, draft: next };
}

function markAttempted(state: WizardState, step: WizardStep): WizardStep[] {
  return state.attemptedSteps.includes(step)
    ? state.attemptedSteps
    : [...state.attemptedSteps, step];
}

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case "patchDraft":
      return withDraft(state, { ...state.draft, ...action.patch });

    case "setFlyerType":
      return withDraft(state, switchFlyerType(state.draft, action.flyerType));

    case "patchSingleEvent": {
      const current = state.draft.events[0] ?? createEmptyEventDraft();
      const rest = state.draft.events.slice(1);
      return withDraft(state, {
        ...state.draft,
        events: [{ ...current, ...action.patch }, ...rest],
      });
    }

    case "upsertEvent": {
      const index = state.draft.events.findIndex(
        (event) => event.localId === action.event.localId,
      );
      let events: EventDraft[];
      if (index >= 0) {
        events = state.draft.events.map((event, i) =>
          i === index ? action.event : event,
        );
      } else if (state.draft.flyerType === "single") {
        events = [action.event];
      } else {
        events = [...state.draft.events, action.event];
      }
      return withDraft(state, { ...state.draft, events });
    }

    case "removeEvent": {
      const events = state.draft.events.filter(
        (event) => event.localId !== action.localId,
      );
      const next = withDraft(state, { ...state.draft, events });
      const editingRemoved =
        state.lineupView.kind === "edit" &&
        state.lineupView.localId === action.localId;
      return editingRemoved ? { ...next, lineupView: LIST_VIEW } : next;
    }

    case "setLineupView":
      return { ...state, lineupView: action.view };

    case "selectDate":
      return {
        ...state,
        calendar: { ...state.calendar, selectedDate: action.date },
      };

    case "setVisibleMonth":
      return {
        ...state,
        calendar: { ...state.calendar, visibleMonth: action.month },
      };

    case "next": {
      const attemptedSteps = markAttempted(state, state.step);
      if (state.returnTo === "hub") {
        return {
          ...state,
          step: "review",
          returnTo: null,
          lineupView: LIST_VIEW,
          attemptedSteps,
        };
      }
      const step = stepAfter(state.step) ?? state.step;
      return { ...state, step, lineupView: LIST_VIEW, attemptedSteps };
    }

    case "back": {
      if (state.lineupView.kind !== "list") {
        return { ...state, lineupView: LIST_VIEW };
      }
      if (state.returnTo === "hub") {
        return { ...state, step: "review", returnTo: null };
      }
      const step = stepBefore(state.step) ?? state.step;
      return { ...state, step };
    }

    case "jumpTo":
      return {
        ...state,
        step: action.step,
        returnTo: action.returnTo ?? null,
        lineupView: LIST_VIEW,
      };

    case "markAttempted":
      return { ...state, attemptedSteps: markAttempted(state, action.step) };

    case "hydrate": {
      const merged: WizardState = { ...state, ...action.state };
      const draft = enforceFlyerTypeInvariant(merged.draft);
      const calendar = action.state.calendar
        ? merged.calendar
        : { ...merged.calendar, visibleMonth: resolveVisibleMonth(draft) };
      return { ...merged, draft, calendar };
    }

    case "reset":
      return {
        ...action.state,
        draft: enforceFlyerTypeInvariant(action.state.draft),
      };

    default:
      return state;
  }
}

/** `YYYY-MM` of the earliest event start, else of `today`. */
export function resolveVisibleMonth(
  draft: FlyerDraft,
  today: Date = new Date(),
): string {
  const dated = draft.events
    .filter((event) => !!event.startDate)
    .map((event) => event.startDate);
  if (dated.length === 0) return monthKey(today);
  const earliest = dated.slice().sort()[0];
  return monthKey(parseDateLocal(earliest));
}

export function createInitialWizardState(input: {
  draft: FlyerDraft;
  step?: WizardStep;
  today?: Date;
}): WizardState {
  const draft = enforceFlyerTypeInvariant(input.draft);
  return {
    draft,
    step: input.step ?? "basics",
    lineupView: LIST_VIEW,
    returnTo: null,
    attemptedSteps: [],
    calendar: {
      visibleMonth: resolveVisibleMonth(draft, input.today),
      selectedDate: null,
    },
  };
}
