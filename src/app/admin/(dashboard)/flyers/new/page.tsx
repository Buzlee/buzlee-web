import { Suspense } from "react";
import { CreateFlyerScreen } from "@/features/admin/flyers/create-flyer-screen";

export const metadata = { title: "Create flyer" };

/** Create a flyer on behalf of an approved business (`?business=<id>`). */
export default function AdminCreateFlyerPage() {
  return (
    <Suspense>
      <CreateFlyerScreen />
    </Suspense>
  );
}
