// PORTED FROM buzlee-app/src/features/admin-batch-upload/lib/remote-media.ts — keep in sync; see docs/admin-sync.md
/**
 * Fetch flyer media from a URL in the batch CSV and prepare it for re-upload
 * to Supabase Storage. Media is always re-hosted in the app's own bucket so
 * flyers never depend on (or hotlink to) third-party hosts.
 */

// Web fix: exported — the media-proxy route handler enforces the same cap.
export const MAX_MEDIA_BYTES = 15 * 1024 * 1024; // 15 MB

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export interface RemoteMedia {
  arrayBuffer: ArrayBuffer;
  contentType: string;
  ext: string;
  mediaType: "image" | "pdf";
}

/**
 * Rewrite common share links into direct-download URLs.
 * Google Drive and Dropbox share links otherwise return an HTML preview page.
 */
export function normalizeMediaUrl(url: string): string {
  const driveFileMatch = url.match(
    /^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/,
  );
  if (driveFileMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveFileMatch[1]}`;
  }

  const driveOpenMatch = url.match(
    /^https:\/\/drive\.google\.com\/open\?id=([\w-]+)/,
  );
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveOpenMatch[1]}`;
  }

  if (/^https:\/\/(www\.)?dropbox\.com\//.test(url)) {
    const parsed = url.replace(/([?&])dl=0/, "$1dl=1");
    return parsed.includes("dl=1")
      ? parsed
      : `${parsed}${parsed.includes("?") ? "&" : "?"}dl=1`;
  }

  return url;
}

/**
 * Web fix: browsers cannot fetch third-party media directly (CORS), so the
 * download goes through the same-origin relay at
 * `src/app/admin/api/media-proxy/route.ts`, which passes status and
 * content-type through unchanged.
 */
export function mediaProxyUrl(url: string): string {
  return `/admin/api/media-proxy?url=${encodeURIComponent(url)}`;
}

export async function fetchRemoteMedia(url: string): Promise<RemoteMedia> {
  // Web fix: relayed through mediaProxyUrl (see above).
  const response = await fetch(mediaProxyUrl(normalizeMediaUrl(url)));

  if (!response.ok) {
    throw new Error(`Could not download media (HTTP ${response.status})`);
  }

  const contentType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim();
  const ext = EXTENSION_BY_CONTENT_TYPE[contentType];

  if (!ext) {
    const hint = contentType.startsWith("text/html")
      ? " The link returned a web page — make sure the file is shared publicly and links directly to the image or PDF."
      : "";
    throw new Error(
      `Unsupported media type "${contentType || "unknown"}".${hint}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength === 0) {
    throw new Error("Downloaded media is empty");
  }
  if (arrayBuffer.byteLength > MAX_MEDIA_BYTES) {
    throw new Error(
      `Media is too large (${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(1)} MB, max 15 MB)`,
    );
  }

  return {
    arrayBuffer,
    contentType,
    ext,
    mediaType: ext === "pdf" ? "pdf" : "image",
  };
}
