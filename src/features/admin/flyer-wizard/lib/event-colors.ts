// PORTED FROM buzlee-app/src/features/flyer-wizard/lib/event-colors.ts — keep in sync; see docs/admin-sync.md
// Web fix: the app resolves `--chart-1` / `--primary` / `--chart-5` through
// `useHslCssVar`; the web maps the same three tokens to Tailwind classes.

/** Lineup accent per event, cycling by index (same token order as the app). */
export const EVENT_COLOR_CLASSES = [
  "bg-chart-1",
  "bg-primary",
  "bg-chart-5",
] as const;

export function eventColorClassAt(index: number): string {
  const n = EVENT_COLOR_CLASSES.length;
  return EVENT_COLOR_CLASSES[((index % n) + n) % n];
}
