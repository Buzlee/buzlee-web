import { initialsFrom } from "@/features/admin/lib/format";
import { cn } from "@/lib/utils";

/**
 * Square-ish initials tile used for business logos and resident avatars in
 * admin tables. Shows the image when a URL exists, initials otherwise.
 */
export function InitialsAvatar({
  name,
  imageUrl,
  size = 36,
  rounded = "rounded-lg",
  className,
}: {
  name: string | null | undefined;
  imageUrl?: string | null;
  size?: number;
  rounded?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border bg-secondary font-bold text-secondary-foreground",
        rounded,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size / 3) }}
    >
      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: tiny avatar thumbs; next/image would 500 on non-allowlisted or non-image URLs
        <img
          alt=""
          className="h-full w-full object-cover"
          height={size}
          src={imageUrl}
          width={size}
        />
      ) : (
        initialsFrom(name)
      )}
    </span>
  );
}
