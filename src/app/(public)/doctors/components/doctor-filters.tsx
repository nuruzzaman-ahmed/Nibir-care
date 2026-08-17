"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

type Specialty = { id: string; slug: string; nameBn: string; nameEn: string };

type DoctorFiltersProps = {
  specialties: Specialty[];
  currentParams: Record<string, string | undefined>;
};

export function DoctorFilters({ specialties, currentParams }: DoctorFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(
      Object.entries(currentParams)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, v!])
    );
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => router.push(pathname);

  const hasFilters = Object.values(currentParams).some(Boolean);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <SlidersHorizontal className="h-4 w-4 text-teal-600" />
          ফিল্টার
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-red-500 flex items-center gap-1 hover:text-red-600"
          >
            <X className="h-3 w-3" />
            পরিষ্কার
          </button>
        )}
      </div>

      {/* Availability */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          উপলব্ধতা
        </p>
        <div className="space-y-1.5">
          {[
            { value: "today", label: "আজ উপলব্ধ" },
            { value: "", label: "সবগুলো" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter("available", opt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                (currentParams.available ?? "") === opt.value
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Specialty */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          বিশেষত্ব
        </p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => updateFilter("specialty", "")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !currentParams.specialty
                ? "bg-teal-50 text-teal-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            সব বিশেষত্ব
          </button>
          {specialties.map((s) => (
            <button
              key={s.id}
              onClick={() => updateFilter("specialty", s.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentParams.specialty === s.slug
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.nameBn}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          লিঙ্গ
        </p>
        <div className="space-y-1">
          {[
            { value: "", label: "সবাই" },
            { value: "MALE", label: "পুরুষ" },
            { value: "FEMALE", label: "মহিলা" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter("gender", opt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                (currentParams.gender ?? "") === opt.value
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          সাজানো
        </p>
        <div className="space-y-1">
          {[
            { value: "", label: "রেটিং (সর্বোচ্চ)" },
            { value: "fee_asc", label: "ফি (কম থেকে বেশি)" },
            { value: "fee_desc", label: "ফি (বেশি থেকে কম)" },
            { value: "experience", label: "অভিজ্ঞতা (সর্বোচ্চ)" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter("sort", opt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                (currentParams.sort ?? "") === opt.value
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
