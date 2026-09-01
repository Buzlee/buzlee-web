import { Skeleton } from "@/components/ui/skeleton";

const ROW_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6"] as const;

/** Loading placeholder matching the admin table cards. */
export function TableSkeleton({
  rows = 5,
  avatar = true,
}: {
  rows?: number;
  avatar?: boolean;
}) {
  return (
    <div className="divide-y divide-border">
      {ROW_KEYS.slice(0, Math.min(rows, ROW_KEYS.length)).map((key) => (
        <div className="flex items-center gap-4 px-5 py-3.5" key={key}>
          {avatar ? <Skeleton className="size-9 rounded-lg" /> : null}
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
