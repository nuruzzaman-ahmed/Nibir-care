"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, X, FlaskConical, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Test = {
  id: string; nameEn: string; nameBn: string;
  category?: string | null; price: number; discountPrice?: number | null;
  reportTime?: string | null; preparation?: string | null; duration?: number | null;
  center: {
    id: string; slug: string; nameBn: string; nameEn: string;
    district: string; thana?: string | null; rating: number;
    openingTime?: string | null; closingTime?: string | null;
  };
};

const CATEGORIES = [
  { label: "সব",            value: "all",        icon: "🔬" },
  { label: "রক্ত পরীক্ষা",  value: "Blood",      icon: "🩸" },
  { label: "এক্স-রে",       value: "X-Ray",      icon: "🩻" },
  { label: "আল্ট্রাসাউন্ড", value: "Ultrasound", icon: "📡" },
  { label: "ইসিজি",         value: "ECG",        icon: "❤️" },
  { label: "এমআরআই",        value: "MRI",        icon: "🧲" },
  { label: "সিটি স্ক্যান",  value: "CT",         icon: "💡" },
  { label: "অন্যান্য",      value: "Other",      icon: "🧪" },
];

function TestCard({ test }: { test: Test }) {
  const finalPrice = test.discountPrice ?? test.price;
  const hasDiscount = !!(test.discountPrice && test.discountPrice < test.price);

  return (
    <Link href={`/diagnostic/${test.center.slug}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block overflow-hidden group">

      {/* Category bar */}
      {test.category && (
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-blue-500" />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category chip */}
            {test.category && (
              <span className="inline-block text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wide mb-2">
                {test.category}
              </span>
            )}
            <h3 className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-teal-700 transition-colors">
              {test.nameBn || test.nameEn}
            </h3>
            {test.nameBn && test.nameEn !== test.nameBn && (
              <p className="text-[11px] text-gray-400 mt-0.5">{test.nameEn}</p>
            )}
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            {hasDiscount && (
              <p className="text-[12px] text-gray-400 line-through">৳{test.price.toLocaleString()}</p>
            )}
            <p className={cn(
              "text-[20px] font-extrabold leading-tight",
              hasDiscount ? "text-teal-600" : "text-gray-900"
            )}>
              ৳{finalPrice.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Center info */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-[13px] font-semibold text-gray-800 truncate">{test.center.nameBn}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
            <span>📍 {test.center.district}{test.center.thana ? `, ${test.center.thana}` : ""}</span>
            {test.center.rating > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                ⭐ {test.center.rating.toFixed(1)}
              </span>
            )}
          </div>
          {(test.center.openingTime || test.center.closingTime) && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600">
              <Clock className="h-3 w-3" />
              {test.center.openingTime} – {test.center.closingTime}
            </div>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {test.reportTime && (
            <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-medium">
              ⏱ রিপোর্ট: {test.reportTime}
            </span>
          )}
          {test.duration && (
            <span className="text-[11px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg">
              ⌛ {test.duration} মিনিট
            </span>
          )}
          {test.preparation && (
            <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg line-clamp-1 max-w-[180px]">
              ⚠️ {test.preparation}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="bg-teal-50 group-hover:bg-teal-600 text-teal-700 group-hover:text-white text-center py-2 rounded-xl text-[13px] font-semibold transition-all">
          বুক করুন
        </div>
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
      <div className="flex justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-8 w-16 bg-gray-100 rounded ml-4" />
      </div>
      <div className="mt-4 h-16 bg-gray-50 rounded-xl" />
    </div>
  );
}

export function TestsClient() {
  const [searchQuery, setSearchQuery]       = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [tests, setTests]                   = useState<Test[]>([]);
  const [loading, setLoading]               = useState(true);
  const debounceRef                         = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchTests = useCallback(async (q: string, category: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category && category !== "all") params.set("category", category);
    try {
      const res  = await fetch(`/api/public/tests?${params}`);
      const data = await res.json();
      setTests(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTests(searchQuery, activeCategory);
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, activeCategory, fetchTests]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── TOP BAR ── */}
      <div className="bg-teal-600 pb-14 pt-6">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-teal-100 text-[13px] mb-2">ডায়াগনস্টিক সেবা</p>
          <h1 className="text-2xl font-bold text-white mb-5">টেস্ট বুক করুন</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="CBC, X-Ray, Ultrasound, ECG..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm text-gray-900 placeholder-gray-400 bg-white shadow-lg outline-none focus:ring-2 focus:ring-teal-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Category chips card */}
        <div className="bg-white rounded-2xl shadow-lg p-3 mb-4">
          <div className="flex gap-2 overflow-x-auto scroll-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveCategory(c.value)}
                className={cn(
                  "whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0",
                  activeCategory === c.value
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700"
                )}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-[13px] text-gray-500 mb-4 px-1">
          {loading ? "খুঁজছে..." : <><span className="font-bold text-gray-900">{tests.length}</span>টি টেস্ট পাওয়া গেছে</>}
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
            : tests.length === 0
            ? (
              <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-gray-100">
                <FlaskConical className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                <h3 className="font-semibold text-gray-600 mb-1">কোনো টেস্ট পাওয়া যায়নি</h3>
                <p className="text-sm text-gray-400">ডায়াগনস্টিক সেন্টারগুলো এখনো টেস্ট যোগ করেনি</p>
              </div>
            )
            : tests.map((test) => <TestCard key={test.id} test={test} />)
          }
        </div>
      </div>
    </div>
  );
}
