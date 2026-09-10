"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WizardShellRightAction = {
  label: string;
  onClick: () => void;
  tone?: "accent" | "muted" | "destructive";
  disabled?: boolean;
};

const RIGHT_ACTION_TONE_CLASS = {
  accent: "text-accent-foreground",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
} as const;

/**
 * Web port of buzlee-app's `WizardShell`: nav row (back / step caption /
 * link action), segmented progress, title block, scrolling body and a pinned
 * footer. Fills the dashboard content column below the page header.
 */
export function WizardShell({
  stepIndex,
  totalSteps,
  stepLabel,
  title,
  subtitle,
  onBack,
  backLabel = "Go back",
  rightAction,
  centerSlot,
  hideProgress = false,
  footer,
  scrollRef,
  children,
}: {
  stepIndex: number;
  totalSteps: number;
  stepLabel?: string;
  title: string;
  subtitle?: ReactNode;
  onBack: () => void;
  backLabel?: string;
  rightAction?: WizardShellRightAction;
  centerSlot?: ReactNode;
  hideProgress?: boolean;
  footer?: ReactNode;
  scrollRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
        ref={scrollRef as RefObject<HTMLDivElement | null>}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex h-10 items-center">
            <div className="flex min-w-16 items-center">
              <Button
                aria-label={backLabel}
                onClick={onBack}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <ArrowLeft />
              </Button>
            </div>
            <div className="flex flex-1 items-center justify-center">
              {centerSlot ?? (
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {stepLabel ?? `Step ${stepIndex + 1} of ${totalSteps}`}
                </span>
              )}
            </div>
            <div className="flex min-w-16 items-center justify-end">
              {rightAction ? (
                <button
                  className={cn(
                    "text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50",
                    RIGHT_ACTION_TONE_CLASS[rightAction.tone ?? "accent"],
                  )}
                  disabled={rightAction.disabled}
                  onClick={rightAction.onClick}
                  type="button"
                >
                  {rightAction.label}
                </button>
              ) : null}
            </div>
          </div>

          {hideProgress ? null : (
            <div
              aria-label={`Step ${stepIndex + 1} of ${totalSteps}`}
              aria-valuemax={totalSteps}
              aria-valuemin={1}
              aria-valuenow={stepIndex + 1}
              className="flex gap-1.5"
              role="progressbar"
            >
              {Array.from({ length: totalSteps }, (_, index) => (
                <span
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    index <= stepIndex ? "bg-foreground" : "bg-border",
                  )}
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static segments
                  key={index}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-border bg-background px-6 py-4">
          <div className="mx-auto w-full max-w-2xl">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}
