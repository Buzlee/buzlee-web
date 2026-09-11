import { BatchUploadScreen } from "@/features/admin/batch-upload/ui/batch-upload-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Batch upload" };

/** Tools → Batch upload — import businesses or flyers from a CSV. */
export default function AdminBatchUploadPage() {
  return (
    <>
      <PageHeader title="Batch upload" />
      <BatchUploadScreen />
    </>
  );
}
