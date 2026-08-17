"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/reviews/review-form";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: Date | string;
  user: { name?: string | null };
};

export function ReviewsSection({
  centerId,
  initialReviews,
  isLoggedIn,
}: {
  centerId: string;
  initialReviews: Review[];
  isLoggedIn: boolean;
}) {
  const [reviews, setReviews] = useState(initialReviews);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">রিভিউ ({reviews.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3 pt-0">
        <ReviewForm
          target="center"
          targetId={centerId}
          isLoggedIn={isLoggedIn}
          onSubmitted={(review) => {
            setReviews((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);
          }}
        />
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-50 pb-3 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-700">{review.user.name ?? "পরিচয় গোপন"}</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                ))}
              </div>
            </div>
            {review.comment && <p className="text-xs text-gray-500">{review.comment}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
