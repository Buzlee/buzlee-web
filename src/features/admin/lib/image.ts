/**
 * Client-side image prep for business media uploads.
 *
 * buzlee-app crops in expo-image-picker (`allowsEditing`, fixed `aspect`,
 * `quality: 0.8`) and uploads JPEG. The web has no native cropper, so we
 * centre-crop to the same aspect ratio, cap the long edge, and re-encode as
 * JPEG at the same quality — the stored asset shape matches what the app
 * writes, and the mobile UI renders both identically.
 */

export const LOGO_ASPECT = 1;
export const COVER_ASPECT = 16 / 9;

const JPEG_QUALITY = 0.8;

export type PrepareImageOptions = {
  /** Width / height. The source is centre-cropped to this ratio. */
  aspect: number;
  /** Cap on the output's long edge in pixels. */
  maxSize: number;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type);
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path (e.g. unsupported type in this browser).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Centre-crop + downscale + JPEG-encode a picked file for upload.
 */
export async function prepareImage(
  file: File,
  { aspect, maxSize }: PrepareImageOptions,
): Promise<Blob> {
  const source = await decode(file);
  const srcW = source.width;
  const srcH = source.height;
  if (!srcW || !srcH) throw new Error("Could not read image dimensions");

  // Crop rect in source pixels.
  let cropW = srcW;
  let cropH = Math.round(srcW / aspect);
  if (cropH > srcH) {
    cropH = srcH;
    cropW = Math.round(srcH * aspect);
  }
  const cropX = Math.round((srcW - cropW) / 2);
  const cropY = Math.round((srcH - cropH) / 2);

  // Output size, capped on the long edge.
  const scale = Math.min(1, maxSize / Math.max(cropW, cropH));
  const outW = Math.max(1, Math.round(cropW * scale));
  const outH = Math.max(1, Math.round(cropH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  // JPEG has no alpha — flatten transparent PNGs onto white like the app's
  // picker does when it re-encodes.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  if ("close" in source && typeof source.close === "function") source.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
