"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: string;
  ctaLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

/**
 * Promise-based confirm dialog — the web stand-in for RN `Alert.alert`
 * decisions. `confirm(opts)` resolves `true` on the CTA, `false` on cancel /
 * dismiss. Render `dialog` once anywhere in the tree.
 */
export function useConfirm(): { confirm: ConfirmFn; dialog: React.ReactNode } {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback<ConfirmFn>(
    (next) =>
      new Promise<boolean>((resolve) => {
        // A second prompt while one is open cancels the first.
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const dialog = (
    <Dialog
      onOpenChange={(open) => !open && settle(false)}
      open={options !== null}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{options?.title}</DialogTitle>
          {options?.description ? (
            <DialogDescription>{options.description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => settle(false)} type="button" variant="outline">
            {options?.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            autoFocus
            className={cn(
              options?.destructive
                ? "bg-destructive text-white hover:bg-destructive/90"
                : "bg-foreground text-background hover:bg-foreground/90",
            )}
            onClick={() => settle(true)}
            type="button"
          >
            {options?.ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}
