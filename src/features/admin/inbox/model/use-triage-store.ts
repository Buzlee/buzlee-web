// Web adaptation of buzlee-app/src/features/admin-inbox/model/use-triage-store.ts — see docs/admin-sync.md
// Same state + actions and the same `useTriageStore(selector)` call shape, but
// backed by a module-level store and useSyncExternalStore instead of Zustand
// (not a web dependency).
/**
 * Session-only skip bookkeeping for the admin Inbox "Next up" card.
 *
 * Deliberately not persisted: a skip is "not now", not a state. Reloading the
 * tab resets the pass to oldest first — nothing to sync, nothing to migrate.
 */
import { useSyncExternalStore } from "react";

type TriageStore = {
  /** Ids skipped in this pass, in the order they were skipped. */
  skippedIds: string[];
  skip: (id: string) => void;
  /** Drop ids that are no longer pending so a re-submitted item starts fresh. */
  prune: (pendingIds: readonly string[]) => void;
  reset: () => void;
};

const EMPTY: string[] = [];
let skippedIds: string[] = EMPTY;
const listeners = new Set<() => void>();

function setSkippedIds(next: string[]) {
  skippedIds = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const actions = {
  skip: (id: string) =>
    setSkippedIds([...skippedIds.filter((existing) => existing !== id), id]),
  prune: (pendingIds: readonly string[]) => {
    const pending = new Set(pendingIds);
    const next = skippedIds.filter((id) => pending.has(id));
    if (next.length !== skippedIds.length) setSkippedIds(next);
  },
  reset: () => {
    if (skippedIds.length > 0) setSkippedIds(EMPTY);
  },
};

export function useTriageStore<T>(selector: (state: TriageStore) => T): T {
  const ids = useSyncExternalStore(
    subscribe,
    () => skippedIds,
    // Skips only happen in the browser; the server always renders a fresh pass.
    () => EMPTY,
  );
  return selector({ skippedIds: ids, ...actions });
}
