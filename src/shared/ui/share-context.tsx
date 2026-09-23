"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import {
  ensurePostHog,
  SHARE_SUPER_PROPERTIES,
  type ShareIds,
  shareProperties,
} from "@/shared/lib/posthog-provider";

/**
 * Registers the shared object's ids as PostHog super properties for the life
 * of the page, so `$pageview` and every later event carry them. Renders nothing.
 */
export function ShareContext({ flyerId, businessId, flyerEventId }: ShareIds) {
  useEffect(() => {
    // Child effects run before the root provider's, so initialise here: the
    // initial $pageview fires one tick after init and must already see the ids.
    if (!ensurePostHog()) return;
    posthog.register(shareProperties({ flyerId, businessId, flyerEventId }));
    return () => {
      for (const prop of SHARE_SUPER_PROPERTIES) posthog.unregister(prop);
    };
  }, [flyerId, businessId, flyerEventId]);
  return null;
}
