// PORTED FROM buzlee-app/src/entities/flyer/lib/flyer-recurrence.ts — keep in sync; see docs/admin-sync.md
/**
 * Recurrence preset ⇄ RRULE-ish string helpers shared by the flyer wizard,
 * batch upload and display code.
 *
 * Stored form (flyer_events.recurrence_rule / flyers.recurrence_rule):
 *   'FREQ=DAILY;INTERVAL=1' | 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE' | 'FREQ=MONTHLY;INTERVAL=1'
 * The end of a series lives in the separate `recurrence_until` column, never
 * as `UNTIL=` inside the rule.
 */

export type RecurrencePreset = "none" | "daily" | "weekly" | "monthly";

const RECURRENCE_RULE_BY_PRESET = {
  none: null,
  daily: "FREQ=DAILY;INTERVAL=1",
  monthly: "FREQ=MONTHLY;INTERVAL=1",
} as const;

export const WEEKDAY_CODES = [
  "SU",
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
] as const;
export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export const WEEKDAY_CODE_TO_INDEX: Record<WeekdayCode, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export const WEEKDAY_LABEL_BY_CODE: Record<WeekdayCode, string> = {
  SU: "Sunday",
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
};

function normalizeWeekdayCodes(weekdays: string[] | undefined): WeekdayCode[] {
  if (!weekdays || weekdays.length === 0) return ["MO"];
  const seen = new Set<WeekdayCode>();
  for (const day of weekdays) {
    if (WEEKDAY_CODES.includes(day as WeekdayCode)) {
      seen.add(day as WeekdayCode);
    }
  }
  const normalized = WEEKDAY_CODES.filter((code) => seen.has(code));
  return normalized.length > 0 ? normalized : ["MO"];
}

export function getRecurrenceRuleFromPreset(
  preset: string,
  weeklyRecurrenceDays?: string[],
): string | null {
  if (preset in RECURRENCE_RULE_BY_PRESET) {
    return RECURRENCE_RULE_BY_PRESET[
      preset as keyof typeof RECURRENCE_RULE_BY_PRESET
    ];
  }
  if (preset === "weekly") {
    const days = normalizeWeekdayCodes(weeklyRecurrenceDays).join(",");
    return `FREQ=WEEKLY;INTERVAL=1;BYDAY=${days}`;
  }
  return null;
}

export function getRecurrencePresetFromRule(
  rule: string | null | undefined,
): RecurrencePreset {
  if (!rule) return "none";
  if (rule.includes("FREQ=DAILY")) return "daily";
  if (rule.includes("FREQ=WEEKLY")) return "weekly";
  if (rule.includes("FREQ=MONTHLY")) return "monthly";
  return "none";
}

/** Frequency of a stored rule, or null when it is not a recurrence we understand. */
export function parseRecurrenceFrequency(
  rule?: string | null,
): "daily" | "weekly" | "monthly" | null {
  const preset = getRecurrencePresetFromRule(rule);
  return preset === "none" ? null : preset;
}

/** Weekday codes from a weekly rule's BYDAY, in the order they appear. */
export function parseWeeklyByDayCodes(rule?: string | null): WeekdayCode[] {
  if (!rule) return [];
  const byDay = rule.match(/BYDAY=([A-Z,]+)/)?.[1];
  if (!byDay) return [];
  return byDay
    .split(",")
    .filter((code): code is WeekdayCode =>
      WEEKDAY_CODES.includes(code as WeekdayCode),
    );
}

/** Sorted, de-duplicated JS weekday indexes (0 = Sunday) from a weekly rule's BYDAY. */
export function parseWeeklyByDays(rule?: string | null): number[] {
  const indexes = parseWeeklyByDayCodes(rule).map(
    (code) => WEEKDAY_CODE_TO_INDEX[code],
  );
  return [...new Set(indexes)].sort((a, b) => a - b);
}

export function getWeeklyRecurrenceDaysFromRule(
  rule: string | null | undefined,
  fallbackDateTime?: string,
): WeekdayCode[] {
  if (rule) {
    const parsed = parseWeeklyByDayCodes(rule);
    if (parsed.length > 0) {
      const normalized = normalizeWeekdayCodes(parsed);
      if (normalized.length > 0) return normalized;
    }
  }
  if (fallbackDateTime) {
    const naive = fallbackDateTime
      .replace(/[+-]\d{2}(:\d{2})?$/, "")
      .replace(/Z$/, "");
    const fallback = new Date(naive);
    if (!Number.isNaN(fallback.getTime())) {
      return [WEEKDAY_CODES[fallback.getDay()] ?? "MO"];
    }
  }
  return ["MO"];
}
