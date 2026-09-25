// PORTED FROM buzlee-app/src/features/flyer-wizard/lib/section-status.ts — keep in sync; see docs/admin-sync.md
import { formatAgeRestriction } from "@/entities/flyer/lib/age-restriction";
import { formatFlyerEventsSummaryLine } from "@/entities/flyer/lib/flyer-helper";
import { composeAddressWithUnit } from "@/entities/location";
import type {
  FlyerDraft,
  SectionKey,
  SectionStatus,
  WizardStep,
} from "../model/types";
import { formatEventSummary } from "./format-event-summary";
import { eventDraftToSchedule } from "./serialize-flyer-draft";
import { parseAgeBoundMonths, validateStep } from "./validate-wizard-step";

const SEP = " · ";

export type SectionCategory = { id: string; name: string };

const SECTION_STEP: Record<SectionKey, WizardStep> = {
  flyer: "basics",
  schedule: "schedule",
  details: "details",
  location: "location",
};

function flyerSummary(draft: FlyerDraft): string {
  if (!draft.media) return "No artwork yet";
  const kind = draft.media.type === "pdf" ? "PDF" : "Image";
  const cover = draft.coverPhoto ? "Cover photo added" : "No cover photo";
  return `${kind}${SEP}${cover}`;
}

function scheduleSummary(draft: FlyerDraft): string {
  if (draft.flyerType === "single") {
    const event = draft.events[0];
    return event ? formatEventSummary(event) || "No date yet" : "No date yet";
  }
  if (draft.events.length === 0) return "No events yet";
  const dated = draft.events.filter((event) => !!event.startDate);
  if (dated.length === 0) return "No dates yet";
  return formatFlyerEventsSummaryLine(dated.map(eventDraftToSchedule));
}

function detailsSummary(
  draft: FlyerDraft,
  categories: SectionCategory[],
): string {
  const parts: string[] = [];
  const category = categories.find((item) => item.id === draft.categoryId);
  if (category) parts.push(category.name);

  const tagCount = draft.tagIds.length;
  if (tagCount > 0)
    parts.push(`${tagCount} ${tagCount === 1 ? "tag" : "tags"}`);

  if (draft.ageRestriction.enabled) {
    const { min, minUnit, max, maxUnit } = draft.ageRestriction;
    const label = formatAgeRestriction(
      parseAgeBoundMonths(min, minUnit),
      parseAgeBoundMonths(max, maxUnit),
    );
    if (label) parts.push(label);
  }

  return parts.length > 0 ? parts.join(SEP) : "No details yet";
}

function locationSummary(draft: FlyerDraft): string {
  if (!draft.location) return "No address yet";
  const address = composeAddressWithUnit(
    draft.location.formatted_address,
    draft.location.unit,
  );
  const name = draft.locationName.trim();
  return name ? `${name}${SEP}${address}` : address;
}

function sectionTitle(key: SectionKey, draft: FlyerDraft): string {
  switch (key) {
    case "flyer":
      return "Flyer";
    case "schedule":
      return draft.flyerType === "multi" ? "Lineup" : "Schedule";
    case "details":
      return "Details";
    case "location":
      return "Location";
  }
}

function sectionSummary(
  key: SectionKey,
  draft: FlyerDraft,
  categories: SectionCategory[],
): string {
  switch (key) {
    case "flyer":
      return flyerSummary(draft);
    case "schedule":
      return scheduleSummary(draft);
    case "details":
      return detailsSummary(draft, categories);
    case "location":
      return locationSummary(draft);
  }
}

/** Review / edit-hub section rows, in wizard order. */
export function getSectionStatuses(
  draft: FlyerDraft,
  categories: SectionCategory[],
): SectionStatus[] {
  return (Object.keys(SECTION_STEP) as SectionKey[]).map((key) => {
    const step = SECTION_STEP[key];
    const issues = Object.values(validateStep(step, draft)).filter(
      (message): message is string => typeof message === "string",
    );
    return {
      key,
      step,
      title: sectionTitle(key, draft),
      summary: sectionSummary(key, draft, categories),
      complete: issues.length === 0,
      issues,
    };
  });
}
