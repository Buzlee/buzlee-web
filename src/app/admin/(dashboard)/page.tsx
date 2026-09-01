import { Inbox } from "lucide-react";
import { PageHeader } from "@/features/admin/shell/page-header";

/**
 * Inbox — pending businesses + pending claims land here (Phase W-D).
 * Placeholder empty state so the shell is navigable.
 */
export default function AdminInboxPage() {
  return (
    <>
      <PageHeader title="Inbox" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <Inbox className="size-6 text-muted-foreground" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Nothing to review
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pending businesses and claims will show up here.
          </p>
        </div>
      </div>
    </>
  );
}
