"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { isAcceptedImage } from "@/features/admin/lib/image";
import { cn } from "@/lib/utils";

/**
 * Staged image state for a business media slot. `keep` = leave the saved
 * asset as-is; `replace` = upload `file` on save; `remove` = clear the
 * column (and delete the saved asset) on save.
 */
export type ImageChange =
  | { kind: "keep" }
  | { kind: "replace"; file: File }
  | { kind: "remove" };

export const KEEP_IMAGE: ImageChange = { kind: "keep" };

/**
 * Logo / cover picker with preview. Mirrors buzlee-app's StagedLogoField /
 * BusinessLogoPicker: choose, replace, or remove; the actual upload happens
 * on save (create needs the row id first; edit uploads then patches).
 */
export function ImageField({
  id,
  value,
  onChange,
  currentUrl,
  aspect,
  shape = "square",
  disabled = false,
  emptyLabel,
}: {
  id: string;
  value: ImageChange;
  onChange: (next: ImageChange) => void;
  /** Saved asset URL (edit mode). */
  currentUrl?: string | null;
  /** CSS aspect-ratio for the preview box. */
  aspect: number;
  shape?: "square" | "wide";
  disabled?: boolean;
  emptyLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const describedBy = useId();
  const [error, setError] = useState<string | null>(null);

  // Object URL for the staged file; revoked when it changes/unmounts.
  const stagedFile = value.kind === "replace" ? value.file : null;
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!stagedFile) {
      setStagedUrl(null);
      return;
    }
    const url = URL.createObjectURL(stagedFile);
    setStagedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [stagedFile]);

  const previewUrl =
    value.kind === "remove" ? null : (stagedUrl ?? currentUrl ?? null);
  const hasSaved = Boolean(currentUrl);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    setError(null);
    onChange({ kind: "replace", file });
  }

  function handleRemove() {
    setError(null);
    // Removing a staged (unsaved) pick just reverts to the saved asset; removing
    // a saved asset schedules a delete.
    onChange(
      value.kind === "replace" && hasSaved ? KEEP_IMAGE : { kind: "remove" },
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  const canRemove =
    value.kind === "replace" || (hasSaved && value.kind !== "remove");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-4">
        <button
          aria-describedby={describedBy}
          aria-label={previewUrl ? "Replace image" : emptyLabel}
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary",
            shape === "square" ? "size-24" : "h-24 w-[170px]",
            disabled && "cursor-not-allowed opacity-50",
          )}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          style={{ aspectRatio: aspect }}
          type="button"
        >
          {previewUrl ? (
            // biome-ignore lint/performance/noImgElement: local object URL / storage URL preview; next/image can't optimise blob: URLs
            <img
              alt=""
              className="h-full w-full object-cover"
              src={previewUrl}
            />
          ) : (
            <ImagePlus className="size-6" />
          )}
        </button>
        <div className="flex flex-col gap-2">
          <Button
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            {previewUrl ? "Replace" : "Choose image"}
          </Button>
          {canRemove ? (
            <Button
              disabled={disabled}
              onClick={handleRemove}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Trash2 />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={disabled}
        id={id}
        onChange={(e) => handleFile(e.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <p className="text-xs text-muted-foreground" id={describedBy}>
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : value.kind === "remove" ? (
          "Will be removed on save."
        ) : value.kind === "replace" ? (
          `${value.file.name} — cropped to ${shape === "square" ? "square" : "16:9"} on save.`
        ) : (
          emptyLabel
        )}
      </p>
    </div>
  );
}
