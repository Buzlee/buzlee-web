"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { initialsFrom } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";

/**
 * Grouped surface for the Inbox: a white plate on the off-white canvas, with a
 * hairline border and a near-flat shadow. Hierarchy comes from spacing and
 * weight, not heavy chrome.
 */
export const INBOX_SURFACE =
  "overflow-hidden rounded-[14px] border border-border/60 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)] dark:bg-card";

/**
 * Logo tile (businesses) or initials disc (claimants). Falls back to initials
 * when there is no image or the image fails to load.
 */
export function QueueAvatar({
  name,
  imageUrl,
  shape = "square",
  tone = "muted",
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  shape?: "square" | "circle";
  tone?: "muted" | "accent";
  size?: "md" | "lg";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl) && imageUrl !== failedUrl;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden font-semibold select-none",
        size === "lg" ? "size-14 text-base" : "size-10 text-[13px]",
        shape === "circle"
          ? "rounded-full"
          : size === "lg"
            ? "rounded-[13px]"
            : "rounded-[10px]",
        tone === "accent"
          ? "bg-accent text-accent-foreground"
          : "bg-secondary text-muted-foreground",
      )}
    >
      {showImage && imageUrl ? (
        // biome-ignore lint/performance/noImgElement: remote logos from Supabase storage; next/image would 500 on non-allowlisted URLs
        <img
          alt=""
          className="size-full object-cover"
          onError={() => setFailedUrl(imageUrl)}
          // Catches an image that already failed before hydration, when
          // onError fired with no listener attached.
          ref={(node) => {
            if (node?.complete && node.naturalWidth === 0) {
              setFailedUrl(imageUrl);
            }
          }}
          src={imageUrl}
        />
      ) : (
        initialsFrom(name)
      )}
      {/* Inner hairline so light logos keep an edge on the white plate. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/5 ring-inset"
      />
    </span>
  );
}

/** Sentence-case section heading with an optional count, detail and action. */
export function InboxSectionHeader({
  id,
  title,
  count,
  detail,
  action,
}: {
  id: string;
  title: string;
  count?: number;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-6 items-baseline justify-between gap-4">
      <h2
        className="text-[15px] font-semibold tracking-[-0.01em] text-foreground"
        id={id}
      >
        {title}
        {count !== undefined ? (
          <span className="ml-1.5 font-medium text-muted-foreground tabular-nums">
            {count}
          </span>
        ) : null}
        {detail ? (
          <span className="ml-1.5 text-[13px] font-normal tracking-normal text-muted-foreground">
            · {detail}
          </span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}

/** "See all" text link for a section header; the section name is read out. */
export function SeeAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-sm text-[13px] font-medium text-accent-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
      href={href}
    >
      See all<span className="sr-only"> {label}</span>
    </Link>
  );
}

/** A titled group of queue rows on one surface. */
export function QueueSection({
  id,
  title,
  count,
  seeAllHref,
  children,
}: {
  id: string;
  title: string;
  count: number;
  seeAllHref?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <InboxSectionHeader
        action={
          seeAllHref ? (
            <SeeAllLink href={seeAllHref} label={title.toLowerCase()} />
          ) : null
        }
        count={count}
        id={id}
        title={title}
      />
      <ul className={INBOX_SURFACE}>{children}</ul>
    </section>
  );
}

/**
 * One queue item. The whole row is the target and it only navigates —
 * decisions happen on the detail screen, never inline. Separators are inset
 * to the text column and hide next to the hovered row.
 */
export function QueueRow({
  href,
  title,
  meta,
  leading,
  accessory,
  age,
}: {
  href: string;
  title: string;
  meta: string;
  leading: ReactNode;
  /** Optional chip before the age (e.g. the claim domain signal). */
  accessory?: ReactNode;
  age: string;
}) {
  return (
    <li className="relative before:pointer-events-none before:absolute before:top-0 before:right-0 before:left-17 before:h-px before:bg-border/60 first:before:hidden hover:before:opacity-0 [li:hover+&]:before:opacity-0">
      <Link
        className="flex min-h-16 items-center gap-3 px-4 py-3 outline-none transition-colors duration-150 hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-secondary active:duration-0"
        href={href}
      >
        {leading}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] leading-5 font-semibold text-foreground">
            {title}
          </span>
          <span className="truncate text-[13px] leading-5 text-muted-foreground">
            {meta}
          </span>
        </span>
        {accessory ? (
          <span className="hidden shrink-0 sm:inline-flex">{accessory}</span>
        ) : null}
        <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
          {age}
        </span>
        <ChevronRight
          aria-hidden
          className="-mr-1 size-4 shrink-0 text-muted-foreground/60"
        />
      </Link>
    </li>
  );
}
