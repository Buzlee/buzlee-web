// PORTED FROM buzlee-app/src/features/admin-inbox/model/use-triage-queue.ts — keep in sync; see docs/admin-sync.md
import { useCallback, useEffect, useMemo } from "react";
import { useAdminBusinesses } from "@/entities/admin";
import { useBusinessClaims } from "@/entities/business-claim";
import {
  buildTriageQueue,
  resolveTriage,
  type TriageState,
} from "./triage-queue";
import { useTriageStore } from "./use-triage-store";

export type TriageQueue = TriageState & {
  isLoading: boolean;
  skippedIds: readonly string[];
  /** Skip the current `nextUp`. No-op when there is nowhere to go. */
  skipCurrent: () => void;
  isSkipped: (id: string) => boolean;
};

/**
 * One merged review queue (pending businesses + pending claims), oldest
 * first, with session-only skip ordering. Reads the same React Query caches
 * the Inbox and detail screens already use, so it is cheap to mount anywhere.
 */
export function useTriageQueue(): TriageQueue {
  const { data: businesses, isLoading: businessesLoading } = useAdminBusinesses(
    {
      status: "pending",
    },
  );
  const { data: claims, isLoading: claimsLoading } =
    useBusinessClaims("pending");
  const skippedIds = useTriageStore((s) => s.skippedIds);
  const skip = useTriageStore((s) => s.skip);
  const prune = useTriageStore((s) => s.prune);

  const queue = useMemo(
    () => buildTriageQueue(businesses, claims),
    [businesses, claims],
  );
  const state = useMemo(
    () => resolveTriage(queue, skippedIds),
    [queue, skippedIds],
  );

  // Once data has loaded, forget skips for items that were decided elsewhere.
  const isLoading = businessesLoading || claimsLoading;
  useEffect(() => {
    if (isLoading) return;
    prune(queue.map((item) => item.id));
  }, [isLoading, prune, queue]);

  const skipCurrent = useCallback(() => {
    if (!state.canSkip || !state.nextUp) return;
    skip(state.nextUp.id);
  }, [skip, state.canSkip, state.nextUp]);

  const isSkipped = useCallback(
    (id: string) => skippedIds.includes(id),
    [skippedIds],
  );

  return { ...state, isLoading, skippedIds, skipCurrent, isSkipped };
}
