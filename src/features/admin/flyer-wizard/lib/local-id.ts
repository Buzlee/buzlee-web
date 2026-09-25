// PORTED FROM buzlee-app/src/features/flyer-wizard/lib/local-id.ts — keep in sync; see docs/admin-sync.md
// Web fix: `crypto.randomUUID` instead of expo-crypto; same fallback shape.

/**
 * Client-side id for wizard events (EventDraft.localId). Prefers a real v4
 * UUID; falls back to a random string when Web Crypto is unavailable.
 */
export function createLocalId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      const id = crypto.randomUUID();
      if (typeof id === "string" && id.length > 0) return id;
    }
  } catch {
    // fall through to the pseudo-random id
  }
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
