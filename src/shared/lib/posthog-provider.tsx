"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * Events captured from the web surface. Names are "object verb" in the past
 * tense; property keys are snake_case; ids end in `_id` (tracking plan §2).
 */
export type WebEventMap = {
  "open in app tapped": {
    target: "app" | "app_store" | "play_store";
    flyer_id?: string;
    business_id?: string;
    flyer_event_id?: string;
  };
};

/** Super properties a share page registers for the object it shows. */
export const SHARE_SUPER_PROPERTIES = [
  "flyer_id",
  "business_id",
  "flyer_event_id",
] as const;

export type ShareIds = {
  flyerId?: string;
  businessId?: string;
  flyerEventId?: string;
};

export type ShareProperties = Partial<
  Record<(typeof SHARE_SUPER_PROPERTIES)[number], string>
>;

/** Known share ids as snake_case event / super properties. */
export function shareProperties({
  flyerId,
  businessId,
  flyerEventId,
}: ShareIds): ShareProperties {
  const props: ShareProperties = {};
  if (flyerId) props.flyer_id = flyerId;
  if (businessId) props.business_id = businessId;
  if (flyerEventId) props.flyer_event_id = flyerEventId;
  return props;
}

let initialised = false;

/**
 * Initialise PostHog once per page load. Returns `false` and does nothing on
 * the server or when `NEXT_PUBLIC_POSTHOG_KEY` is unset. Safe to call from any
 * effect: the flag also keeps React strict mode's double effect from
 * re-initialising.
 */
export function ensurePostHog(): boolean {
  if (initialised) return true;
  if (typeof window === "undefined") return false;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;

  posthog.init(key, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: "history_change",
    person_profiles: "identified_only",
    autocapture: false,
    disable_session_recording: true,
  });
  // Super properties persist across page loads; drop share ids left by an
  // earlier visit before this page registers its own (see ShareContext).
  for (const prop of SHARE_SUPER_PROPERTIES) posthog.unregister(prop);
  posthog.register({
    app_env: process.env.NEXT_PUBLIC_APP_ENV ?? "unknown",
    surface: "web",
  });
  initialised = true;
  return true;
}

/** Capture a typed event; a no-op until PostHog is initialised. */
export function track<E extends keyof WebEventMap>(
  event: E,
  properties: WebEventMap[E],
): void {
  if (!initialised) return;
  // Sent immediately: "Open in app" can background the tab before a batch flushes.
  posthog.capture(event, properties, { send_instantly: true });
}

/** Mounts once in the root layout so every page captures `$pageview`. */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensurePostHog();
  }, []);
  return <>{children}</>;
}
