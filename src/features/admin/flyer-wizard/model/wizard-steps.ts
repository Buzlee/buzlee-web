// PORTED FROM buzlee-app/src/features/flyer-wizard/model/wizard-steps.ts — keep in sync; see docs/admin-sync.md
import type { FlyerType, WizardMode, WizardStep } from "./types";

export const WIZARD_STEPS: WizardStep[] = [
  "basics",
  "schedule",
  "details",
  "location",
  "review",
];
export const TOTAL_STEPS = WIZARD_STEPS.length;

export function stepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

export function stepAfter(step: WizardStep): WizardStep | null {
  return WIZARD_STEPS[stepIndex(step) + 1] ?? null;
}

export function stepBefore(step: WizardStep): WizardStep | null {
  return WIZARD_STEPS[stepIndex(step) - 1] ?? null;
}

export type StepCopy = {
  title: string;
  subtitle: string;
  /** Footer primary label when the step is reached in sequence. */
  primaryLabel: string;
};

/**
 * Titles / subtitles / primary labels per step, matching the Paper mockups
 * ("Flows — Create & Edit Flyer v2").
 */
export function stepCopy(
  step: WizardStep,
  flyerType: FlyerType,
  mode: WizardMode,
): StepCopy {
  switch (step) {
    case "basics":
      return {
        title: "What are you sharing?",
        subtitle: "Choose a flyer type, add your artwork and give it a name.",
        primaryLabel: "Continue",
      };
    case "schedule":
      return flyerType === "multi"
        ? {
            title: "What's on the lineup?",
            subtitle:
              "Add each event with its own dates, times and repeat rule.",
            primaryLabel: "Continue",
          }
        : {
            title: "When is it happening?",
            subtitle: "Set the date and time, and whether it repeats.",
            primaryLabel: "Continue",
          };
    case "details":
      return {
        title: "Tell people more",
        subtitle:
          "A description, category and tags help the right people find it.",
        primaryLabel: "Continue",
      };
    case "location":
      return {
        title: "Where is it?",
        subtitle: "Add an address so your flyer shows up on the map.",
        primaryLabel: "Review flyer",
      };
    case "review":
      return mode === "edit"
        ? {
            title: "Edit Flyer",
            subtitle: "Changes go live as soon as you save.",
            primaryLabel: "Save changes",
          }
        : {
            title: "Review & publish",
            subtitle: "Everything in one place. Tap a section to change it.",
            primaryLabel: "Publish Flyer",
          };
  }
}

export const FLYER_TYPE_COPY: Record<
  FlyerType,
  { label: string; helper: string; titlePlaceholder: string }
> = {
  single: {
    label: "Single event",
    helper:
      "One event, promotion or announcement. It can still repeat or run over several days.",
    titlePlaceholder: "e.g., Summer Sale, Live Music Night",
  },
  multi: {
    label: "Multiple events",
    helper:
      "Bundle several events into one flyer. Each event keeps its own dates, times and repeat rule.",
    titlePlaceholder: "e.g., Summer Events at The Tap Room",
  },
};
