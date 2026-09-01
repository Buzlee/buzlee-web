import { BusinessesScreen } from "@/features/admin/businesses/businesses-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Businesses" };

export default function AdminBusinessesPage() {
  return (
    <>
      <PageHeader title="Businesses" />
      <BusinessesScreen />
    </>
  );
}
