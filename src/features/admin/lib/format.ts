/**
 * Small display formatters for the admin dashboard tables.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** Compact relative age: "just now", "5m ago", "3h ago", "2d ago", "6w ago". */
export function formatRelativeTime(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = now.getTime() - then;
  if (diff < MINUTE_MS) return "just now";
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)}m ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}h ago`;
  if (diff < WEEK_MS * 4) {
    const days = Math.floor(diff / DAY_MS);
    return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
  }
  return new Date(then).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: undefined,
  });
}

/**
 * Short event date without timezone shifting — the date part of a naive
 * `YYYY-MM-DD...` timestamp, mirroring buzlee-app's local-naive handling.
 */
export function formatShortDate(iso: string | null | undefined): string {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "—";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const sameYear = d.getUTCFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  });
}

/** Full-ish date for detail views ("Aug 14, 2026"). */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Up-to-two-letter initials from a display name or email. */
export function initialsFrom(value: string | null | undefined): string {
  const source = value?.trim() ?? "";
  if (!source) return "?";
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? (words[1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

/** Owner provenance label for a business listing. */
export function ownerLabel(userId: string | null): string {
  return userId ? "Self-listed" : "Admin-posted";
}
