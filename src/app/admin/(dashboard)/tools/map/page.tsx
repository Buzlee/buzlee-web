import { Suspense } from "react";
import { DiscoveryScreen } from "@/features/admin/discovery/ui/discovery-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Map" };

/**
 * Tools → Map — the live flyer dataset as residents see it (map + feed).
 * Suspense: the screen reads `useSearchParams` (`?view=`, `?flyerId=`).
 */
export default function AdminMapPage() {
  return (
    <>
      <PageHeader title="Map" />
      <Suspense fallback={null}>
        <DiscoveryScreen />
      </Suspense>
    </>
  );
}
