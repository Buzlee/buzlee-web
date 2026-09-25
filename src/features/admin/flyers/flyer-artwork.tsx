import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Flyer artwork at a fixed aspect without cropping: the poster is contained,
 * and a blurred copy of itself fills the letterbox so odd aspect ratios
 * (square posters, wide banners) still read as one framed piece. Used by
 * the flyer review page and the map's detail panel.
 */
export function FlyerArtwork({
  src,
  alt,
  className,
  imgClassName,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Extra classes for the contained image (e.g. a viewport height cap). */
  imgClassName?: string;
  /** Rendered when there is no image (or it is a PDF). */
  fallback?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden bg-secondary",
        className,
      )}
    >
      {src ? (
        <>
          {/* biome-ignore lint/performance/noImgElement: remote storage asset; plain img avoids loader failures */}
          <img
            alt=""
            aria-hidden
            className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-xl saturate-150"
            decoding="async"
            draggable={false}
            src={src}
          />
          {/* biome-ignore lint/performance/noImgElement: remote storage asset; plain img avoids loader failures */}
          <img
            alt={alt}
            className={cn("relative size-full object-contain", imgClassName)}
            decoding="async"
            src={src}
          />
        </>
      ) : (
        fallback
      )}
      {/* Inner hairline so light artwork keeps an edge on the canvas. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/5 ring-inset"
      />
    </div>
  );
}
