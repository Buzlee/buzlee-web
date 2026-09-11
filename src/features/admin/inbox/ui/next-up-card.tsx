"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { formatRelativeTime } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";
import { remainingCopy, type TriageState } from "../model/triage-queue";
import { INBOX_SURFACE, InboxSectionHeader, QueueAvatar } from "./queue-list";

const PILL_BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-full px-4.5 text-sm font-semibold whitespace-nowrap outline-none select-none transition-[background-color,transform] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] active:duration-75";

function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      aria-hidden
      className={cn(
        "hidden h-5 min-w-5 items-center justify-center rounded-[5px] px-1 font-sans text-[11px] font-semibold md:inline-flex",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/**
 * Inbox hero (port of buzlee-app `features/admin-inbox/ui/NextUpCard`): the
 * oldest undecided item and one primary action. Amber is spent on the verb,
 * not the number. Skip is offered only when there is somewhere else to go.
 *
 * Desktop adaptation: actions sit bottom-right (primary last, the default
 * button — Return triggers it), with the remaining-count copy opposite them.
 * Only the item content is keyed and crossfades on skip, so focus stays on the
 * Skip button for keyboard users.
 */
export function NextUpCard({
  state,
  onSkip,
}: {
  state: TriageState;
  onSkip: () => void;
}) {
  const item = state.nextUp;
  if (!item) return null;

  const isClaim = item.kind === "claim";

  return (
    <section aria-labelledby="inbox-next-up" className="flex flex-col gap-2.5">
      <InboxSectionHeader
        detail="Oldest first"
        id="inbox-next-up"
        title="Next up"
      />

      <div
        className={cn(
          INBOX_SURFACE,
          "shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_-16px_rgb(15_23_42/0.16)]",
        )}
      >
        <div
          className="flex items-center gap-4 p-5 motion-safe:animate-fade-in"
          key={item.id}
        >
          <QueueAvatar
            imageUrl={item.imageUrl}
            name={item.title}
            shape={isClaim ? "circle" : "square"}
            size="lg"
            tone={isClaim ? "accent" : "muted"}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-[17px] leading-6 font-semibold tracking-[-0.015em] text-foreground">
              {item.title}
            </p>
            <p className="truncate text-[13px] leading-5 text-muted-foreground">
              {item.meta}
            </p>
          </div>
          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-secondary px-2.5 text-xs font-medium text-secondary-foreground tabular-nums">
            {state.isBackAround
              ? "Skipped"
              : formatRelativeTime(item.createdAt)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border/60 px-5 py-3.5">
          <p className="min-w-0 flex-1 basis-48 text-[13px] leading-5 text-muted-foreground">
            {remainingCopy(state)}
          </p>
          {/* Announces the new item after a skip; silent on first render. */}
          <span aria-live="polite" className="sr-only">
            {`Next up: ${item.title}, ${item.meta}`}
          </span>
          <div className="flex items-center gap-2">
            {state.canSkip ? (
              <button
                aria-keyshortcuts="S"
                className={cn(
                  PILL_BUTTON,
                  "border border-border/80 bg-white text-foreground hover:bg-secondary/60 dark:bg-card",
                )}
                onClick={onSkip}
                title="Move to the end of the queue"
                type="button"
              >
                Skip
                <Kbd className="bg-secondary text-muted-foreground">S</Kbd>
              </button>
            ) : null}
            <Link
              aria-keyshortcuts="Enter"
              aria-label={`Review ${item.title} now`}
              className={cn(
                PILL_BUTTON,
                // Ink on amber: 8:1 contrast, where white on amber is ~2:1.
                "bg-primary text-neutral-950 hover:bg-primary/90",
              )}
              href={item.href}
            >
              Review now
              <Kbd className="bg-neutral-950/10 text-neutral-950/70">↵</Kbd>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
