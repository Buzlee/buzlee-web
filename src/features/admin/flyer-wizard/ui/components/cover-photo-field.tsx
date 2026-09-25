"use client";

import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { coverPhotoDraftFromFile, IMAGE_ACCEPT } from "../../lib/media";
import type { CoverPhotoDraft } from "../../model/types";

/**
 * Optional cover photo row — web port of the app's `CoverPhotoRow`:
 * thumbnail + copy, Add / Replace / Remove.
 */
export function CoverPhotoField({
  id,
  coverPhoto,
  onChange,
  disabled = false,
}: {
  id: string;
  coverPhoto: CoverPhotoDraft | null;
  onChange: (coverPhoto: CoverPhotoDraft | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const next = coverPhotoDraftFromFile(file);
    if (!next) {
      setError("Choose a JPEG, PNG, WebP or GIF image.");
      return;
    }
    setError(null);
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card p-3",
        disabled && "opacity-50",
      )}
    >
      {coverPhoto ? (
        // biome-ignore lint/performance/noImgElement: object URL / storage URL preview
        <img
          alt="Selected cover"
          className="size-10 shrink-0 rounded-md bg-muted object-cover"
          src={coverPhoto.uri}
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Cover photo</p>
        <p className="truncate text-xs text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : coverPhoto ? (
            "Added · cropped to 2:3 on save"
          ) : (
            "Optional · shown behind your flyer details"
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          size="sm"
          type="button"
          variant="outline"
        >
          {coverPhoto ? "Replace" : "Add"}
        </Button>
        {coverPhoto ? (
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
        ) : null}
      </div>
      <input
        accept={IMAGE_ACCEPT}
        className="sr-only"
        disabled={disabled}
        id={id}
        onChange={(event) => handleFile(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
