"use client";

import { FileText, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/features/admin/businesses/business-form";
import { cn } from "@/lib/utils";
import { ARTWORK_ACCEPT, mediaDraftFromFile } from "../../lib/media";
import type { FlyerMediaDraft } from "../../model/types";

/**
 * "Flyer artwork" field — web port of the app's `ArtworkDropzone`: a dashed
 * drop target / file picker (image or PDF), or once picked an aspect-correct
 * preview (PDF tile) with Replace / Remove.
 */
export function ArtworkField({
  id,
  media,
  onChange,
  error,
  disabled = false,
}: {
  id: string;
  media: FlyerMediaDraft | null;
  onChange: (media: FlyerMediaDraft | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const next = mediaDraftFromFile(file);
    if (!next) {
      setPickError("Choose a JPEG, PNG, WebP or GIF image, or a PDF.");
      return;
    }
    setPickError(null);
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Field
      error={error ?? pickError ?? undefined}
      htmlFor={id}
      label="Flyer artwork *"
    >
      {media ? (
        <div className="flex flex-col gap-3">
          {media.type === "pdf" ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-accent">
                <FileText className="size-5 text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {media.name}
                </p>
                <p className="text-xs tracking-wider text-muted-foreground uppercase">
                  PDF
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center rounded-xl bg-muted p-3">
              {/* biome-ignore lint/performance/noImgElement: object URL / storage URL preview */}
              <img
                alt="Selected artwork"
                className="max-h-80 rounded-lg object-contain"
                src={media.uri}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              Replace
            </Button>
            <Button
              className="text-destructive hover:text-destructive"
              disabled={disabled}
              onClick={() => onChange(null)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        // biome-ignore lint/a11y/noStaticElementInteractions: drop target wrapping a real button
        <div
          className={cn(
            "flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-8 transition-colors",
            dragging ? "border-foreground bg-secondary/60" : "border-border",
            error && "border-destructive",
            disabled && "opacity-50",
          )}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled) handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-accent">
            <ImageIcon className="size-6 text-accent-foreground" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-semibold text-foreground">
              Upload image or PDF
            </p>
            <p className="text-center text-xs text-muted-foreground">
              JPG, PNG or PDF · tall artwork (1080 × 1620) looks best · drag a
              file here
            </p>
          </div>
          <Button
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            size="sm"
            type="button"
            variant="outline"
          >
            Choose file
          </Button>
        </div>
      )}
      <input
        accept={ARTWORK_ACCEPT}
        className="sr-only"
        disabled={disabled}
        id={id}
        onChange={(event) => handleFile(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
    </Field>
  );
}
