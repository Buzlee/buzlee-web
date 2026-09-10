import { ClaimsScreen } from "@/features/admin/claims/claims-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Claims" };

/** Claims — pending / approved / declined ownership requests with history. */
export default function AdminClaimsPage() {
  return (
    <>
      <PageHeader title="Claims" />
      <ClaimsScreen />
    </>
  );
}
