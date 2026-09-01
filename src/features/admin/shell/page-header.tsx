import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 72px dashboard page header: title on the left, optional actions on the
 * right, bottom border. Rendered per page (not in the layout).
 */
export function PageHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border px-6",
        className,
      )}
    >
      <h1 className="min-w-0 text-[22px] font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
