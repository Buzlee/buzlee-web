import { ResidentsScreen } from "@/features/admin/residents/residents-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Residents" };

export default function AdminResidentsPage() {
  return (
    <>
      <PageHeader title="Residents" />
      <ResidentsScreen />
    </>
  );
}
