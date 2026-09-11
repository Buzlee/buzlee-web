// PORTED FROM buzlee-app/src/features/flyer-wizard/model/use-flyer-wizard.ts — keep in sync; see docs/admin-sync.md
// Web fix: RN `Alert` prompts become the injected `confirm()` (promise-based
// dialog); the AsyncStorage resume/autosave and `usePreventRemove` guard are
// replaced by an in-memory draft plus a `beforeunload` prompt while dirty
// (disarmed via `markSaved` once the draft is persisted).
// There is no shared date/time sheet on the web.

/**
 * Flyer wizard state hook. Owns the reducer, step validation gating and the
 * unsaved-changes guard. Step screens only see `FlyerWizardApi`.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import type { ConfirmFn } from "@/features/admin/dialogs/use-confirm";
import { getSectionStatuses } from "../lib/section-status";
import {
  isDraftPublishable,
  validateEventDraft,
  validateStep,
} from "../lib/validate-wizard-step";
import {
  createDraftFromFlyer,
  createEmptyFlyerDraft,
} from "./create-flyer-draft";
import type {
  EventDraft,
  FlyerDraft,
  FlyerType,
  HubVariant,
  StepIssues,
  WizardMode,
  WizardState,
  WizardStep,
} from "./types";
import type {
  FlyerWizardActions,
  FlyerWizardApi,
  SubmitEventThen,
} from "./wizard-api";
import { createInitialWizardState, wizardReducer } from "./wizard-reducer";
import { stepIndex as indexOfStep, TOTAL_STEPS } from "./wizard-steps";

export type UseFlyerWizardOptions = {
  mode: WizardMode;
  businessId: string;
  existingFlyer: FlyerWithDetails | null;
  existingTagIds: string[];
  categories: { id: string; name: string }[];
  /** Leave the wizard (screen-owned navigation). */
  onExit: () => void;
  /** Modal confirmation (resolves true when the user accepts). */
  confirm: ConfirmFn;
};

const NO_ISSUES: StepIssues = {};

function hasIssues(issues: StepIssues): boolean {
  return Object.keys(issues).length > 0;
}

function isLiveStatus(flyer: FlyerWithDetails | null): boolean {
  return flyer?.status === "live" || flyer?.status === "approved";
}

function buildInitialState(opts: UseFlyerWizardOptions): WizardState {
  const draft = opts.existingFlyer
    ? createDraftFromFlyer(opts.existingFlyer, opts.existingTagIds)
    : createEmptyFlyerDraft("single");
  return createInitialWizardState({
    draft,
    step: opts.mode === "edit" ? "review" : "basics",
  });
}

export function useFlyerWizard(opts: UseFlyerWizardOptions): FlyerWizardApi {
  const { mode, businessId, existingFlyer, categories, onExit, confirm } = opts;

  const [state, dispatch] = useReducer(wizardReducer, opts, buildInitialState);

  // Latest state for stable action callbacks (avoids stale closures without
  // re-creating every action on each keystroke).
  const stateRef = useRef(state);
  stateRef.current = state;
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;

  // Snapshot `isDirty` compares against the initial draft.
  const [baselineJson] = useState(() => JSON.stringify(state.draft));
  // Set once the wizard is leaving on its own terms (successful save / exit).
  const exitingRef = useRef(false);

  const [eventFormAttempted, setEventFormAttempted] = useState(false);
  const [lastEventAttempt, setLastEventAttempt] = useState<EventDraft | null>(
    null,
  );

  const scrollRef = useRef<HTMLElement | null>(null);

  const draftJson = useMemo(() => JSON.stringify(state.draft), [state.draft]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const { draft, step, lineupView } = state;
  const isDirty = draftJson !== baselineJson;

  const hubVariant: HubVariant =
    mode === "edit" && isLiveStatus(existingFlyer) ? "live" : "review";

  const issues = useMemo<StepIssues>(
    () =>
      state.attemptedSteps.includes(step)
        ? validateStep(step, draft)
        : NO_ISSUES,
    [state.attemptedSteps, step, draft],
  );

  const editingEvent = useMemo<EventDraft | null>(() => {
    if (lineupView.kind !== "edit") return null;
    const { localId } = lineupView;
    return draft.events.find((event) => event.localId === localId) ?? null;
  }, [lineupView, draft.events]);

  const eventIssues = useMemo<StepIssues>(() => {
    if (!eventFormAttempted) return NO_ISSUES;
    const target = lastEventAttempt ?? editingEvent;
    if (!target) return NO_ISSUES;
    return validateEventDraft(target, {
      requireTitle: true,
      requireUntil: draft.flyerType === "multi",
    });
  }, [eventFormAttempted, lastEventAttempt, editingEvent, draft.flyerType]);

  const canContinue =
    step === "schedule" && draft.flyerType === "multi"
      ? draft.events.length >= 1
      : true;

  const sectionStatuses = useMemo(
    () => getSectionStatuses(draft, categories),
    [draft, categories],
  );
  const isPublishable = useMemo(() => isDraftPublishable(draft), [draft]);

  // ---------------------------------------------------------------------------
  // Unsaved-changes guard (browser navigation / reload)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (exitingRef.current) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const resetEventForm = useCallback(() => {
    setEventFormAttempted(false);
    setLastEventAttempt(null);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  }, []);

  const patchDraft = useCallback((patch: Partial<FlyerDraft>) => {
    dispatch({ type: "patchDraft", patch });
  }, []);

  const setFlyerType = useCallback((flyerType: FlyerType) => {
    const current = stateRef.current.draft;
    const dropping =
      current.flyerType === "multi" && flyerType === "single"
        ? current.events.length - 1
        : 0;
    if (dropping > 0) {
      void confirmRef
        .current({
          title: "Keep only the first event?",
          description: `The other ${dropping} ${dropping === 1 ? "event" : "events"} will be removed.`,
          ctaLabel: "Keep first",
          destructive: true,
        })
        .then((ok) => {
          if (ok) dispatch({ type: "setFlyerType", flyerType });
        });
      return;
    }
    dispatch({ type: "setFlyerType", flyerType });
  }, []);

  const patchSingleEvent = useCallback((patch: Partial<EventDraft>) => {
    dispatch({ type: "patchSingleEvent", patch });
  }, []);

  const openAddEvent = useCallback(
    (prefillDate?: string) => {
      resetEventForm();
      dispatch({
        type: "setLineupView",
        view: prefillDate ? { kind: "add", prefillDate } : { kind: "add" },
      });
    },
    [resetEventForm],
  );

  const openEditEvent = useCallback(
    (localId: string) => {
      resetEventForm();
      dispatch({ type: "setLineupView", view: { kind: "edit", localId } });
    },
    [resetEventForm],
  );

  const closeEventForm = useCallback(() => {
    resetEventForm();
    dispatch({ type: "setLineupView", view: { kind: "list" } });
  }, [resetEventForm]);

  const submitEvent = useCallback(
    (event: EventDraft, then: SubmitEventThen): boolean => {
      const problems = validateEventDraft(event, {
        requireTitle: true,
        requireUntil: stateRef.current.draft.flyerType === "multi",
      });
      if (hasIssues(problems)) {
        setLastEventAttempt(event);
        setEventFormAttempted(true);
        return false;
      }
      dispatch({ type: "upsertEvent", event });
      dispatch({
        type: "setLineupView",
        view: then === "another" ? { kind: "add" } : { kind: "list" },
      });
      dispatch({ type: "selectDate", date: event.startDate });
      resetEventForm();
      return true;
    },
    [resetEventForm],
  );

  const removeEvent = useCallback(
    (localId: string) => {
      const target = stateRef.current.draft.events.find(
        (event) => event.localId === localId,
      );
      const name = target?.title.trim()
        ? `“${target.title.trim()}”`
        : "This event";
      void confirmRef
        .current({
          title: "Remove from lineup?",
          description: `${name} will be removed from this flyer.`,
          ctaLabel: "Remove",
          destructive: true,
        })
        .then((ok) => {
          if (!ok) return;
          dispatch({ type: "removeEvent", localId });
          dispatch({ type: "setLineupView", view: { kind: "list" } });
          resetEventForm();
        });
    },
    [resetEventForm],
  );

  const selectDate = useCallback((date: string | null) => {
    dispatch({ type: "selectDate", date });
  }, []);

  const setVisibleMonth = useCallback((month: string) => {
    dispatch({ type: "setVisibleMonth", month });
  }, []);

  /** markAttempted → validate; true when the current step is clean. */
  const attemptCurrentStep = useCallback((): boolean => {
    const { step: current, draft: currentDraft } = stateRef.current;
    dispatch({ type: "markAttempted", step: current });
    if (hasIssues(validateStep(current, currentDraft))) {
      scrollToTop();
      return false;
    }
    return true;
  }, [scrollToTop]);

  const next = useCallback(() => {
    if (!attemptCurrentStep()) return;
    // The reducer returns to the hub itself when `returnTo === 'hub'`.
    dispatch({ type: "next" });
    scrollToTop();
  }, [attemptCurrentStep, scrollToTop]);

  const exit = useCallback(() => {
    const dirty = JSON.stringify(stateRef.current.draft) !== baselineJson;
    if (!dirty || exitingRef.current) {
      exitingRef.current = true;
      onExitRef.current();
      return;
    }
    void confirmRef
      .current({
        title: "Discard changes?",
        description:
          "You have unsaved changes. They will be lost if you leave.",
        ctaLabel: "Discard",
        destructive: true,
      })
      .then((ok) => {
        if (!ok) return;
        exitingRef.current = true;
        onExitRef.current();
      });
  }, [baselineJson]);

  const back = useCallback(() => {
    const { step: current, lineupView: view, returnTo } = stateRef.current;
    if (view.kind !== "list") {
      resetEventForm();
      dispatch({ type: "setLineupView", view: { kind: "list" } });
      return;
    }
    if (returnTo === "hub") {
      dispatch({ type: "back" });
      scrollToTop();
      return;
    }
    const atEntry =
      indexOfStep(current) === 0 || (mode === "edit" && current === "review");
    if (atEntry) {
      exit();
      return;
    }
    dispatch({ type: "back" });
    scrollToTop();
  }, [mode, resetEventForm, exit, scrollToTop]);

  const jumpTo = useCallback(
    (target: WizardStep, options?: { returnTo?: "hub" }) => {
      dispatch({
        type: "jumpTo",
        step: target,
        returnTo: options?.returnTo ?? null,
      });
      scrollToTop();
    },
    [scrollToTop],
  );

  const done = useCallback(() => {
    if (!attemptCurrentStep()) return;
    dispatch({ type: "jumpTo", step: "review", returnTo: null });
    scrollToTop();
  }, [attemptCurrentStep, scrollToTop]);

  const markEventFormAttempted = useCallback(() => {
    setEventFormAttempted(true);
  }, []);

  // The draft is on the server now; the guard compares against the initial
  // snapshot, so without this a post-save navigation still looks "dirty".
  const markSaved = useCallback(() => {
    exitingRef.current = true;
  }, []);

  const actions = useMemo<FlyerWizardActions>(
    () => ({
      patchDraft,
      setFlyerType,
      patchSingleEvent,
      openAddEvent,
      openEditEvent,
      closeEventForm,
      submitEvent,
      removeEvent,
      selectDate,
      setVisibleMonth,
      next,
      back,
      jumpTo,
      done,
      exit,
      markEventFormAttempted,
      markSaved,
    }),
    [
      patchDraft,
      setFlyerType,
      patchSingleEvent,
      openAddEvent,
      openEditEvent,
      closeEventForm,
      submitEvent,
      removeEvent,
      selectDate,
      setVisibleMonth,
      next,
      back,
      jumpTo,
      done,
      exit,
      markEventFormAttempted,
      markSaved,
    ],
  );

  return {
    mode,
    businessId,
    existingFlyer,
    state,
    draft,
    step,
    stepIndex: indexOfStep(step),
    totalSteps: TOTAL_STEPS,
    lineupView,
    hubVariant,
    issues,
    eventIssues,
    canContinue,
    sectionStatuses,
    isPublishable,
    isDirty,
    editingEvent,
    actions,
    scrollRef,
  };
}
