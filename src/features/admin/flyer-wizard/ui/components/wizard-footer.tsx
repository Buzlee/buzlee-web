"use client";

import { Button } from "@/components/ui/button";

export type WizardFooterButton = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/**
 * Web port of the app's `WizardFooter`: primary CTA on the right, optional
 * secondary beside it, optional destructive text link on the left and fine
 * print underneath.
 */
export function WizardFooter({
  primary,
  secondary,
  destructiveLink,
  finePrint,
}: {
  primary: WizardFooterButton;
  secondary?: WizardFooterButton;
  destructiveLink?: WizardFooterButton;
  finePrint?: string;
}) {
  const primaryDisabled = !!primary.disabled || !!primary.loading;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          {destructiveLink ? (
            <button
              className="text-sm font-semibold text-destructive transition-opacity hover:opacity-70 disabled:opacity-50"
              disabled={destructiveLink.disabled}
              onClick={destructiveLink.onClick}
              type="button"
            >
              {destructiveLink.label}
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {secondary ? (
            <Button
              disabled={secondary.disabled || secondary.loading}
              onClick={secondary.onClick}
              type="button"
              variant="outline"
            >
              {secondary.loading ? `${secondary.label}…` : secondary.label}
            </Button>
          ) : null}
          <Button
            aria-busy={primary.loading}
            className="bg-foreground text-background hover:bg-foreground/90"
            disabled={primaryDisabled}
            onClick={primary.onClick}
            type="button"
          >
            {primary.loading ? `${primary.label}…` : primary.label}
          </Button>
        </div>
      </div>
      {finePrint ? (
        <p className="text-right text-xs text-muted-foreground">{finePrint}</p>
      ) : null}
    </div>
  );
}
