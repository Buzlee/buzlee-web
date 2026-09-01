"use client";

import { useEffect, useState } from "react";
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

/**
 * Rejection / take-down dialog with quick-pick reason chips and an optional
 * typed detail; the composed reason is "<pick> — <detail>". "Other" requires
 * a typed detail (mirrors buzlee-app's ReasonSheet).
 */
export function RejectDialog({
  open,
  onOpenChange,
  title,
  description,
  reasons,
  ctaLabel,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  reasons: readonly string[];
  ctaLabel: string;
  pending?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [pick, setPick] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  // Reset per open so a reused dialog never leaks the previous decision.
  useEffect(() => {
    if (open) {
      setPick(null);
      setDetail("");
    }
  }, [open]);

  const trimmedDetail = detail.trim();
  const canConfirm =
    pick !== null && (pick !== "Other" || trimmedDetail.length > 0);

  function handleConfirm() {
    if (!canConfirm || pick === null) return;
    const reason =
      pick === "Other"
        ? trimmedDetail
        : trimmedDetail
          ? `${pick} — ${trimmedDetail}`
          : pick;
    onConfirm(reason);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason) => {
              const active = pick === reason;
              return (
                <button
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  key={reason}
                  onClick={() => setPick(active ? null : reason)}
                  type="button"
                >
                  {reason}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              htmlFor="reject-detail"
            >
              Add detail · optional
            </label>
            <textarea
              className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              id="reject-detail"
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Shown to the owner alongside the reason"
              value={detail}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!canConfirm || pending}
            onClick={handleConfirm}
            type="button"
            variant="destructive"
          >
            {pending ? "Working…" : ctaLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
