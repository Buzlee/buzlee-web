import { InboxScreen } from "@/features/admin/inbox/inbox-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Inbox" };

/** Inbox — pending business approvals + claim requests. */
export default function AdminInboxPage() {
  return (
    <>
      <PageHeader title="Inbox" />
      <InboxScreen />
    </>
  );
}
