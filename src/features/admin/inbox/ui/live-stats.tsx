"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { InboxSectionHeader } from "./queue-list";

export type LiveStat = {
  label: string;
  value: number | undefined;
  href: string;
};

/**
 * "Live on Buzlee" — quiet, informational totals on the canvas (no cards),
 * separated by hairlines. Each figure opens the list it counts.
 */
export function LiveStats({ stats }: { stats: LiveStat[] }) {
  return (
    <section aria-labelledby="inbox-live" className="flex flex-col gap-2">
      <InboxSectionHeader id="inbox-live" title="Live on Buzlee" />
      {/* Negative inset lines the figures up with the header while the hover
          plate keeps its padding. */}
      <div className="-mx-4 grid grid-cols-3">
        {stats.map((stat) => (
          <Link
            className="group relative flex min-w-0 flex-col gap-0.5 rounded-xl px-4 py-3 outline-none transition-colors duration-150 not-first:before:absolute not-first:before:inset-y-3 not-first:before:left-0 not-first:before:w-px not-first:before:bg-border/60 hover:bg-secondary/60 hover:before:opacity-0 focus-visible:ring-2 focus-visible:ring-ring/50 active:bg-secondary active:duration-0 [a:hover+&]:before:opacity-0"
            href={stat.href}
            key={stat.label}
          >
            <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-foreground tabular-nums">
              {stat.value === undefined
                ? "—"
                : stat.value.toLocaleString("en-US")}
            </span>
            <span className="flex items-center gap-0.5 truncate text-[13px] text-muted-foreground transition-colors group-hover:text-foreground">
              {stat.label}
              <ChevronRight
                aria-hidden
                className="size-3.5 shrink-0 -translate-x-1 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
