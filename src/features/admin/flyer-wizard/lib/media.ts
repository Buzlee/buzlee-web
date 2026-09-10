/**
 * Web media staging for the flyer wizard. The app hands the pickers'
 * file:// uris to the upload layer; browsers keep the `File` on the draft
 * (see `FlyerMediaDraft.file`) and prepare an upload `Blob` at save time.
 */
import {
  ACCEPTED_IMAGE_TYPES,
  FLYER_COVER_ASPECT,
  prepareImage,
  toJpegBlob,
} from "@/features/admin/lib/image";
import type { CoverPhotoDraft, FlyerMediaDraft } from "../model/types";

export const ARTWORK_ACCEPT = [...ACCEPTED_IMAGE_TYPES, "application/pdf"].join(
  ",",
);
export const IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export function mediaDraftFromFile(file: File): FlyerMediaDraft | null {
  if (file.type === "application/pdf") {
    return {
      uri: URL.createObjectURL(file),
      type: "pdf",
      name: file.name || `flyer-${Date.now()}.pdf`,
      file,
    };
  }
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      uri: URL.createObjectURL(file),
      type: "image",
      name: `flyer-${Date.now()}.jpg`,
      file,
    };
  }
  return null;
}

export function coverPhotoDraftFromFile(file: File): CoverPhotoDraft | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return null;
  return {
    uri: URL.createObjectURL(file),
    name: `cover-${Date.now()}.jpg`,
    file,
  };
}

/** Upload body for staged artwork: PDFs as-is, images as JPEG. */
export async function mediaUploadBlob(media: FlyerMediaDraft): Promise<Blob> {
  if (!media.file) throw new Error("Artwork must be re-added before saving");
  return media.type === "pdf" ? media.file : toJpegBlob(media.file);
}

/** Upload body for a staged cover photo: centre-cropped 2:3 JPEG like the app's picker. */
export async function coverPhotoUploadBlob(
  cover: CoverPhotoDraft,
): Promise<Blob> {
  if (!cover.file)
    throw new Error("Cover photo must be re-added before saving");
  return prepareImage(cover.file, {
    aspect: FLYER_COVER_ASPECT,
    maxSize: 1600,
  });
}

/** Release object URLs created for staged files. */
export function revokeDraftUrl(uri: string | null | undefined): void {
  if (uri?.startsWith("blob:")) URL.revokeObjectURL(uri);
}
