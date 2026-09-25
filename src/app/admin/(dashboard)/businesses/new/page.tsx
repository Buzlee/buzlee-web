import { CreateBusinessScreen } from "@/features/admin/businesses/create-business-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Create business" };

/** Create an admin-posted (unclaimed) business listing. */
export default function AdminCreateBusinessPage() {
  return (
    <>
      <PageHeader title="Create business" />
      <CreateBusinessScreen />
    </>
  );
}
