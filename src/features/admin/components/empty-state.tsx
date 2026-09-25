import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered empty/caught-up state for admin lists. */
export function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  caption,
  action,
  className,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  caption?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-8 py-16 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full bg-secondary",
          iconClassName,
        )}
      >
        <Icon className="size-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {caption ? (
          <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
