"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string | Date;
  user: { name?: string | null; image?: string | null };
};

export function ReviewForm({
  target,
  targetId,
  isLoggedIn,
  onSubmitted,
}: {
  target: "doctor" | "center";
  targetId: string;
  isLoggedIn: boolean;
  onSubmitted: (review: Review, aggregate: { rating: number; totalReviews: number }) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
        রিভিউ দিতে হলে{" "}
        <a href="/login" className="text-teal-600 font-semibold hover:underline">লগইন করুন</a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center text-sm text-emerald-700 font-medium">
        ✓ আপনার রিভিউ জমা হয়েছে, ধন্যবাদ!
      </div>
    );
  }

  const submit = async () => {
    if (rating === 0) { setError("তারকা দিয়ে রেটিং দিন"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [target === "doctor" ? "doctorId" : "centerId"]: targetId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "রিভিউ জমা দেওয়া যায়নি");
        return;
      }
      setDone(true);
      onSubmitted(data.review, data.aggregate);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-[13px] font-semibold text-gray-700 mb-2.5">আপনার অভিজ্ঞতা শেয়ার করুন</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                n <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="আপনার মতামত লিখুন (ঐচ্ছিক)..."
        rows={3}
        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none bg-white"
      />
      {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}
      <Button onClick={submit} disabled={submitting} size="sm" className="w-full mt-3 bg-teal-600 hover:bg-teal-700">
        {submitting ? "জমা হচ্ছে..." : "রিভিউ জমা দিন"}
      </Button>
    </div>
  );
}
