// PORTED FROM buzlee-app/src/features/flyer-wizard/model/wizard-api.ts — keep in sync; see docs/admin-sync.md
// Web trim: no shared date/time sheet (native <input type="date|time">), no
// local-draft actions (saveAndExit / discardLocal — the web keeps drafts in
// memory only), and `scrollRef` points at the scrolling HTMLElement.

/**
 * Contract between the wizard state hook (`useFlyerWizard`) and the step
 * screens. Steps receive `wizard: FlyerWizardApi` and never touch the reducer
 * directly, so UI and state can be built and tested independently.
 */
import type { RefObject } from "react";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";
import type { GeocodedLocation } from "@/entities/location";
import type {
  EventDraft,
  FlyerDraft,
  FlyerType,
  HubVariant,
  LineupView,
  SectionStatus,
  StepIssues,
  WizardMode,
  WizardState,
  WizardStep,
} from "./types";

export type SubmitEventThen = "list" | "another";

export interface FlyerWizardActions {
  patchDraft: (patch: Partial<FlyerDraft>) => void;
  /** Confirms before discarding extra events on multi → single. */
  setFlyerType: (flyerType: FlyerType) => void;
  patchSingleEvent: (patch: Partial<EventDraft>) => void;

  // Lineup (multi)
  openAddEvent: (prefillDate?: string) => void;
  openEditEvent: (localId: string) => void;
  closeEventForm: () => void;
  /** Validates (requireTitle + requireUntil), upserts, returns whether it was accepted. */
  submitEvent: (event: EventDraft, then: SubmitEventThen) => boolean;
  /** Confirms, then removes and returns to the list. */
  removeEvent: (localId: string) => void;
  selectDate: (date: string | null) => void;
  setVisibleMonth: (month: string) => void;

  // Navigation
  /** markAttempted → validate current step → advance (or no-op when invalid). */
  next: () => void;
  /** Reducer back; on the first step (or the hub in edit mode) calls `onExit` (confirming when dirty). */
  back: () => void;
  jumpTo: (step: WizardStep, opts?: { returnTo?: "hub" }) => void;
  /** Validate the current step, then return to the hub (only meaningful when returnTo === 'hub'). */
  done: () => void;
  /** Leave the wizard, confirming first when there are unsaved changes. */
  exit: () => void;
  /**
   * Disarm the unsaved-changes guard after the draft was persisted (or the
   * flyer was unpublished / deleted). Call before the screen navigates away so
   * a full-page navigation does not trigger the browser's "Leave site?" prompt.
   */
  markSaved: () => void;
  /** Marks the open event form as attempted (drives inline errors). */
  markEventFormAttempted: () => void;
}

export interface FlyerWizardApi {
  mode: WizardMode;
  businessId: string;
  existingFlyer: FlyerWithDetails | null;
  state: WizardState;
  draft: FlyerDraft;
  step: WizardStep;
  stepIndex: number;
  totalSteps: number;
  lineupView: LineupView;
  hubVariant: HubVariant;
  /** Issues for the current step; `{}` until the step is in `attemptedSteps`. */
  issues: StepIssues;
  /** Issues for the open event form; `{}` until `markEventFormAttempted`. */
  eventIssues: StepIssues;
  /** Footer disabled state where the mockup asks for it (multi lineup needs ≥1 event). */
  canContinue: boolean;
  sectionStatuses: SectionStatus[];
  isPublishable: boolean;
  isDirty: boolean;
  /** The event being edited in `lineupView.kind === 'edit'`, else null. */
  editingEvent: EventDraft | null;
  actions: FlyerWizardActions;
  /** Scroll container of the current step for scroll-to-top on errors. */
  scrollRef: RefObject<HTMLElement | null>;
}

/** Props every step screen receives. */
export interface WizardStepProps {
  wizard: FlyerWizardApi;
  categories: { id: string; name: string }[];
  businessName?: string;
  businessLocation?: GeocodedLocation | null;
  /** Footer primary handler is decided by the screen (Continue / Done / Review). */
  onPrimary: () => void;
  primaryLabel: string;
}
