// Web barrel — subset of buzlee-app/src/entities/flyer/lib/index.ts. Only the
// pure schedule/lineup helpers the admin dashboard renders with; RN-only
// modules (animations, notifications, sheet descriptions) are not ported.

export {
  type AgeUnit,
  ageToMonths,
  formatAgeRestriction,
  formatFlyerAgeRestriction,
  getFlyerAgeRange,
  MAX_AGE_MONTHS,
  monthsToAgeInput,
} from "./age-restriction";
export { calculateExpiresAt, combineDateAndTime } from "./flyer-datetime";
export {
  type FlyerEventSchedule,
  formatCompactTimeRange,
  formatFlyerEventLine,
  formatFlyerEventsSummaryLine,
  formatFlyerRecurrenceLine,
  getEventOccurrenceWindow,
  getEventSpanEnd,
  type OccurrenceWindow,
} from "./flyer-helper";
export {
  parseRecurrenceFrequency,
  type RecurrencePreset,
  type WeekdayCode,
} from "./flyer-recurrence";
export {
  type EventTimeStatus,
  getEventTimeStatus,
  groupEventsByHorizon,
  type LineupHorizonGroup,
} from "./lineup";
