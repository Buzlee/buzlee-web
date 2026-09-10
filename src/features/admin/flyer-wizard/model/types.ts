// PORTED FROM buzlee-app/src/features/flyer-wizard/model/types.ts — keep in sync; see docs/admin-sync.md
/**
 * Flyer wizard domain model.
 *
 * A FlyerDraft is the in-progress flyer the 5-step wizard edits. Flyer-level
 * fields live on the draft; each event (one for `single`, ≥1 for `multi`) is
 * an EventDraft with its own full schedule. Drafts serialise to
 * `UpsertFlyerWithEventsInput` (entities/flyer) on save.
 */

import type { AgeUnit } from "@/entities/flyer/lib/age-restriction";
import type {
  RecurrencePreset,
  WeekdayCode,
} from "@/entities/flyer/lib/flyer-recurrence";
import type { FlyerVisibility } from "@/entities/flyer/model/types";
import type { GeocodedLocation } from "@/entities/location";

export type { RecurrencePreset, WeekdayCode };

export type FlyerType = "single" | "multi";

/** Wizard steps in order. Step 2 renders as Schedule (single) or Lineup (multi). */
export type WizardStep =
  | "basics"
  | "schedule"
  | "details"
  | "location"
  | "review";

/** Sub-view of the multi-event Lineup step. */
export type LineupView =
  | { kind: "list" }
  | { kind: "add"; prefillDate?: string }
  | { kind: "edit"; localId: string };

/** Review step renders as the publish review (create / draft) or the live edit hub. */
export type HubVariant = "review" | "live";

export interface EventDraft {
  /** Client id, stable across storage round-trips. */
  localId: string;
  /** flyer_events.id when hydrated from the server, else null. */
  serverId: string | null;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** HH:mm, or '' for all-day / unspecified. */
  startTime: string;
  /** YYYY-MM-DD, or '' for "same day". */
  endDate: string;
  /** HH:mm, or ''. */
  endTime: string;
  recurrence: RecurrencePreset;
  /** Used when recurrence === 'weekly'. */
  weeklyDays: WeekdayCode[];
  /** YYYY-MM-DD, or ''. Required in multi lineups when repeating; optional for single. */
  recurrenceUntil: string;
  /** Display only (edit hub): flyer_events.check_in_count. */
  checkInCount?: number;
}

export interface FlyerMediaDraft {
  /** Remote URL (existing upload) or a local object URL for a staged file. */
  uri: string;
  type: "image" | "pdf";
  name: string;
  // Web fix: the picked File travels with the draft (the app re-reads its
  // file:// uri at upload time; browsers cannot re-open a path).
  file?: File;
}

export interface CoverPhotoDraft {
  uri: string;
  name: string;
  // Web fix: see FlyerMediaDraft.file.
  file?: File;
}

export interface AgeRestrictionDraft {
  enabled: boolean;
  min: string;
  minUnit: AgeUnit;
  /** '' = no upper bound */
  max: string;
  maxUnit: AgeUnit;
}

export interface FlyerDraft {
  flyerType: FlyerType;
  title: string;
  media: FlyerMediaDraft | null;
  /** Edit mode: media was re-picked and must be re-uploaded. */
  mediaChanged: boolean;
  coverPhoto: CoverPhotoDraft | null;
  coverPhotoChanged: boolean;
  /** single: exactly one; multi: zero or more (≥1 to continue). */
  events: EventDraft[];
  description: string;
  categoryId: string;
  tagIds: string[];
  ageRestriction: AgeRestrictionDraft;
  location: GeocodedLocation | null;
  locationName: string;
  externalLink: string;
  visibility: FlyerVisibility;
}

export interface WizardState {
  draft: FlyerDraft;
  step: WizardStep;
  lineupView: LineupView;
  /** Set when a Review/Hub section row pushed this step; "Done" returns there. */
  returnTo: "hub" | null;
  /** Steps where Continue was pressed at least once — gates inline errors. */
  attemptedSteps: WizardStep[];
  calendar: {
    /** YYYY-MM */
    visibleMonth: string;
    /** YYYY-MM-DD */
    selectedDate: string | null;
  };
}

export type IssueKey =
  | "media"
  | "title"
  | "events"
  | "eventTitle"
  | "startDate"
  | "startTime"
  | "endDate"
  | "endTime"
  | "recurrenceUntil"
  | "weeklyDays"
  | "categoryId"
  | "ageMin"
  | "ageMax"
  | "location"
  | "externalLink";

/** Field → human message. Empty object = valid. */
export type StepIssues = Partial<Record<IssueKey, string>>;

export type SectionKey = "flyer" | "schedule" | "details" | "location";

export interface SectionStatus {
  key: SectionKey;
  step: WizardStep;
  title: string;
  summary: string;
  complete: boolean;
  issues: string[];
}

export type WizardMode = "create" | "edit";
