import { Suspense } from "react";
import { FlyerReviewScreen } from "@/features/admin/flyers/flyer-review-screen";

export const metadata = { title: "Review flyer" };

export default function AdminFlyerReviewPage() {
  return (
    <Suspense>
      <FlyerReviewScreen />
    </Suspense>
  );
}
