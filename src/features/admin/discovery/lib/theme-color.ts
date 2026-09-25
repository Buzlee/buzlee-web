/**
 * Read a Tailwind theme colour (`--color-*` in globals.css) at runtime so
 * MapLibre paint properties — which take literal colour strings — stay on
 * the dashboard's design tokens instead of duplicating hex values.
 */
export function themeColor(
  element: HTMLElement,
  token: "primary" | "foreground" | "background",
): string {
  return getComputedStyle(element).getPropertyValue(`--color-${token}`).trim();
}
