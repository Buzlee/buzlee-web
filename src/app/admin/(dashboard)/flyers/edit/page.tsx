import { Suspense } from "react";
import { EditFlyerScreen } from "@/features/admin/flyers/edit-flyer-screen";

export const metadata = { title: "Edit flyer" };

/** Edit an existing flyer (`?id=<flyerId>`). */
export default function AdminEditFlyerPage() {
  return (
    <Suspense>
      <EditFlyerScreen />
    </Suspense>
  );
}
