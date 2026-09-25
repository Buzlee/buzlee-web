import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { BusinessesScreen } from "@/features/admin/businesses/businesses-screen";
import { PageHeader } from "@/features/admin/shell/page-header";

export const metadata = { title: "Businesses" };

export default function AdminBusinessesPage() {
  return (
    <>
      <PageHeader
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/businesses/new">
              <Plus />
              Add listing
            </Link>
          </Button>
        }
        title="Businesses"
      />
      <Suspense>
        <BusinessesScreen />
      </Suspense>
    </>
  );
}
