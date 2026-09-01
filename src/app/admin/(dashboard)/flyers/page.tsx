import { FlyersScreen } from "@/features/admin/flyers/flyers-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Flyers" };

export default function AdminFlyersPage() {
  return (
    <>
      <PageHeader title="Flyers" />
      <FlyersScreen />
    </>
  );
}
