// PORTED FROM buzlee-app/src/features/flyer-wizard/lib/validate-wizard-step.ts — keep in sync; see docs/admin-sync.md
import {
  type AgeUnit,
  ageToMonths,
  MAX_AGE_MONTHS,
} from "@/entities/flyer/lib/age-restriction";
import { combineDateAndTime } from "@/entities/flyer/lib/flyer-datetime";
import { createEmptyEventDraft } from "../model/create-flyer-draft";
import type {
  AgeRestrictionDraft,
  EventDraft,
  FlyerDraft,
  StepIssues,
  WizardStep,
} from "../model/types";

export const CONTENT_STEPS: WizardStep[] = [
  "basics",
  "schedule",
  "details",
  "location",
];

/** Parse one age bound input into months; null when empty or invalid. */
export function parseAgeBoundMonths(
  value: string,
  unit: AgeUnit,
): number | null {
  if (!value.trim()) return null;
  const parsed = parseInt(value, 10);
  // Web fix: Number.isNaN (repo lints noGlobalIsNan).
  if (Number.isNaN(parsed) || parsed < 0) return null;
  const months = ageToMonths(parsed, unit);
  return months > MAX_AGE_MONTHS ? null : months;
}

/** Age range rules (same messages as the old form). Disabled restriction ⇒ valid. */
export function validateAgeRestriction(age: AgeRestrictionDraft): StepIssues {
  if (!age.enabled) return {};
  const issues: StepIssues = {};
  const minMonths = parseAgeBoundMonths(age.min, age.minUnit);
  if (age.min.trim() && minMonths == null) {
    issues.ageMin = "Please enter a valid minimum age (up to 100 years)";
  }
  const maxMonths = parseAgeBoundMonths(age.max, age.maxUnit);
  if (age.max.trim() && maxMonths == null) {
    issues.ageMax = "Please enter a valid maximum age (up to 100 years)";
  }
  if (minMonths != null && maxMonths != null && maxMonths < minMonths) {
    issues.ageMax =
      "Maximum age must be greater than or equal to the minimum age";
  }
  return issues;
}

/**
 * Validate the event schedule as full instants, not date-only strings.
 * End date on the same day as the start is valid when no end time is set
 * (it means "runs through the end of that day"), but an explicit end time
 * must land strictly after the start instant — otherwise the occurrence
 * window collapses to zero. An end time without an end date means a
 * same-day event, so it is validated against the start date.
 */
export function validateEventSchedule(
  event: Pick<EventDraft, "startDate" | "startTime" | "endDate" | "endTime">,
): StepIssues {
  const hasEndDate = !!event.endDate;
  const hasEndTime = !!event.endTime;
  if (!hasEndDate && !hasEndTime) return {};

  // YYYY-MM-DD strings compare correctly lexicographically.
  if (hasEndDate && event.endDate < event.startDate) {
    return { endDate: "End date cannot be before the start date" };
  }

  if (hasEndTime) {
    // ISO-shaped strings (YYYY-MM-DDTHH:mm:00) compare correctly lexicographically.
    const endDate = hasEndDate ? event.endDate : event.startDate;
    const start = combineDateAndTime(event.startDate, event.startTime);
    const end = combineDateAndTime(endDate, event.endTime);
    if (end <= start) {
      return { endTime: "End time must be after the start time" };
    }
  }

  return {};
}

export type ValidateEventOptions = {
  /** Multi-event lineups name each event; single flyers reuse the flyer title. */
  requireTitle: boolean;
  /** "Repeats until" is required in lineups, optional for single flyers. */
  requireUntil: boolean;
};

export function validateEventDraft(
  event: EventDraft,
  options: ValidateEventOptions,
): StepIssues {
  const issues: StepIssues = {};

  if (options.requireTitle && !event.title.trim()) {
    issues.eventTitle = "Give this event a name";
  }

  if (!event.startDate) {
    issues.startDate = "Choose a start date";
    return issues;
  }

  Object.assign(issues, validateEventSchedule(event));

  if (event.recurrence !== "none") {
    if (event.recurrence === "weekly" && event.weeklyDays.length === 0) {
      issues.weeklyDays = "Pick at least one day of the week";
    }
    if (event.recurrenceUntil) {
      if (event.recurrenceUntil < event.startDate) {
        issues.recurrenceUntil =
          "Repeat end date cannot be before the start date";
      }
    } else if (options.requireUntil) {
      issues.recurrenceUntil = "Choose when this event stops repeating";
    }
  }

  return issues;
}

const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

export function isHttpUrl(value: string): boolean {
  return HTTP_URL_PATTERN.test(value.trim());
}

function validateBasics(draft: FlyerDraft): StepIssues {
  const issues: StepIssues = {};
  if (!draft.media) issues.media = "Add your flyer artwork";
  if (!draft.title.trim()) issues.title = "Give your flyer a name";
  return issues;
}

function validateSchedule(draft: FlyerDraft): StepIssues {
  if (draft.flyerType === "single") {
    const event = draft.events[0] ?? createEmptyEventDraft();
    return validateEventDraft(event, {
      requireTitle: false,
      requireUntil: false,
    });
  }
  if (draft.events.length === 0) {
    return { events: "Add at least one event" };
  }
  const anyInvalid = draft.events.some(
    (event) =>
      Object.keys(
        validateEventDraft(event, { requireTitle: true, requireUntil: true }),
      ).length > 0,
  );
  return anyInvalid ? { events: "One or more events need attention" } : {};
}

function validateDetails(draft: FlyerDraft): StepIssues {
  const issues: StepIssues = {};
  if (!draft.categoryId) issues.categoryId = "Choose a category";
  Object.assign(issues, validateAgeRestriction(draft.ageRestriction));
  return issues;
}

function validateLocation(draft: FlyerDraft): StepIssues {
  const issues: StepIssues = {};
  if (!draft.location) issues.location = "Add an address";
  if (draft.externalLink.trim() && !isHttpUrl(draft.externalLink)) {
    issues.externalLink = "Enter a full link starting with http:// or https://";
  }
  return issues;
}

export function validateStep(step: WizardStep, draft: FlyerDraft): StepIssues {
  switch (step) {
    case "basics":
      return validateBasics(draft);
    case "schedule":
      return validateSchedule(draft);
    case "details":
      return validateDetails(draft);
    case "location":
      return validateLocation(draft);
    case "review":
      return {
        ...validateBasics(draft),
        ...validateSchedule(draft),
        ...validateDetails(draft),
        ...validateLocation(draft),
      };
  }
}

export function isStepValid(step: WizardStep, draft: FlyerDraft): boolean {
  return Object.keys(validateStep(step, draft)).length === 0;
}

/** Every content step valid ⇒ the draft can be published. */
export function isDraftPublishable(draft: FlyerDraft): boolean {
  return CONTENT_STEPS.every((step) => isStepValid(step, draft));
}
