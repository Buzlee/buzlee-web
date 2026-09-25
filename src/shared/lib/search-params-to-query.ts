/**
 * Serialize Next.js `searchParams` into a query string (order preserved loosely via URLSearchParams).
 */
export function searchParamsToQueryString(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        qs.append(key, v);
      }
    } else {
      qs.set(key, value);
    }
  }
  const s = qs.toString();
  return s;
}

/** First value of a Next.js `searchParams` entry, or "" when absent. */
export function firstSearchParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return "";
}
