import { Suspense } from "react";
import { ReviewScreen } from "@/features/admin/review/review-screen";

export const metadata = { title: "Review business" };

export default function AdminBusinessReviewPage() {
  return (
    <Suspense>
      <ReviewScreen />
    </Suspense>
  );
}
