"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Stethoscope, FlaskConical, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { DoctorCard } from "@/components/shared/doctor-card";
import { cn } from "@/lib/utils";

type Specialty = { id: string; slug: string; nameBn: string; icon?: string | null };

type Doctor = {
  id: string; slug: string; nameEn: string; nameBn: string;
  photo?: string | null; verificationStatus: string; consultationFee: number;
  experience: number; rating: number; totalReviews: number; isAvailableToday: boolean;
  degrees?: string | null;
  specialties: { specialty: { nameEn: string; nameBn: string }; isPrimary: boolean }[];
  location?: { district: string; thana?: string | null } | null;
  chambers: { id: string; nameBn: string; schedules: { dayOfWeek: number; startTime: string; endTime: string }[] }[];
  todaySchedule?: { startTime: string; endTime: string } | null;
  todayQueue?: { status: string; currentSerial: number; totalBooked: number; waiting: number; avgConsultDuration: number } | null;
};

type Test = {
  id: string; nameEn: string; nameBn: string;
  category?: string | null; price: number; discountPrice?: number | null;
  reportTime?: string | null; preparation?: string | null;
  center: { id: string; slug: string; nameBn: string; district: string; thana?: string | null; rating: number };
};

const TEST_CATEGORIES = [
  { label: "সব", value: "all", icon: "🔬" },
  { label: "রক্ত পরীক্ষা", value: "Blood", icon: "🩸" },
  { label: "এক্স-রে", value: "X-Ray", icon: "🩻" },
  { label: "আল্ট্রাসাউন্ড", value: "Ultrasound", icon: "📡" },
  { label: "ইসিজি", value: "ECG", icon: "❤️" },
  { label: "এমআরআই", value: "MRI", icon: "🧲" },
  { label: "সিটি স্ক্যান", value: "CT", icon: "💡" },
];

function DoctorSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
      <div className="mt-4 h-8 bg-gray-100 rounded-xl" />
    </div>
  );
}

function TestCard({ test }: { test: Test }) {
  return (
    <Link href={`/diagnostic/${test.center.slug}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all p-4 block">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {test.category && (
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {test.category}
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-[15px] leading-tight">{test.nameBn || test.nameEn}</h3>
          <p className="text-[12px] text-gray-500 mt-1 truncate">{test.center.nameBn}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            📍 {test.center.district}{test.center.thana ? `, ${test.center.thana}` : ""}
          </p>
          {test.reportTime && (
            <p className="text-[11px] text-blue-600 mt-1">⏱ রিপোর্ট: {test.reportTime}</p>
          )}
          {test.preparation && (
            <p className="text-[11px] text-amber-600 mt-0.5 line-clamp-1">⚠️ {test.preparation}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {test.discountPrice ? (
            <>
              <p className="text-[13px] text-gray-400 line-through">৳{test.price}</p>
              <p className="text-[18px] font-extrabold text-teal-600">৳{test.discountPrice}</p>
            </>
          ) : (
            <p className="text-[18px] font-extrabold text-gray-900">৳{test.price}</p>
          )}
          <p className="text-[10px] text-gray-400 mt-0.5">মূল্য</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-amber-600">
          ⭐ <span className="font-semibold">{test.center.rating.toFixed(1)}</span>
        </div>
        <span className="text-[12px] font-semibold text-teal-600">বুক করুন →</span>
      </div>
    </Link>
  );
}

export function HomeClient({
  specialties,
  stats,
}: {
  specialties: Specialty[];
  stats: [number, number];
}) {
  const [activeTab, setActiveTab]       = useState<"doctors" | "tests">("doctors");
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("all");
  const [activeCategory, setActiveCategory]   = useState("all");
  const [gender, setGender]             = useState("");
  const [sort, setSort]                 = useState("");
  const [showFilters, setShowFilters]   = useState(false);
  const [doctors, setDoctors]           = useState<Doctor[]>([]);
  const [tests, setTests]               = useState<Test[]>([]);
  const [loading, setLoading]           = useState(true);
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchDoctors = useCallback(async (q: string, specialty: string, g: string, s: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (specialty && specialty !== "all") params.set("specialty", specialty);
    if (g) params.set("gender", g);
    if (s) params.set("sort", s);
    const res = await fetch(`/api/public/doctors?${params}`);
    const data = await res.json();
    setDoctors(data);
    setLoading(false);
  }, []);

  const fetchTests = useCallback(async (q: string, category: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category && category !== "all") params.set("category", category);
    const res = await fetch(`/api/public/tests?${params}`);
    const data = await res.json();
    setTests(data);
    setLoading(false);
  }, []);

  // Debounced fetch on filter change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (activeTab === "doctors") {
        fetchDoctors(searchQuery, activeSpecialty, gender, sort);
      } else {
        fetchTests(searchQuery, activeCategory);
      }
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [activeTab, searchQuery, activeSpecialty, gender, sort, activeCategory, fetchDoctors, fetchTests]);

  const handleTabChange = (tab: "doctors" | "tests") => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const allSpecialties = [{ id: "all", slug: "all", nameBn: "সব" }, ...specialties];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO / SEARCH ── */}
      <div className="bg-teal-600 pt-6 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-teal-100 text-[13px] mb-2">বাংলাদেশের স্বাস্থ্যসেবা প্ল্যাটফর্ম</p>
          <h1 className="text-2xl font-bold text-white mb-5">
            {activeTab === "doctors" ? "ডাক্তার খুঁজুন" : "টেস্ট বুক করুন"}
          </h1>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "doctors" ? "ডাক্তার বা বিশেষত্ব খুঁজুন..." : "টেস্টের নাম লিখুন..."}
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm text-gray-900 placeholder-gray-400 bg-white shadow-lg outline-none focus:ring-2 focus:ring-teal-300"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleTabChange("doctors")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === "doctors" ? "bg-white text-teal-700 shadow" : "bg-teal-500/40 text-white"
              )}
            >
              <Stethoscope className="h-4 w-4" /> ডাক্তার
            </button>
            <button
              onClick={() => handleTabChange("tests")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === "tests" ? "bg-white text-teal-700 shadow" : "bg-teal-500/40 text-white"
              )}
            >
              <FlaskConical className="h-4 w-4" /> ডায়াগনস্টিক টেস্ট
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTERS BAR (pulled up over hero) ── */}
      <div className="max-w-3xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-3">

          {/* Specialty chips (doctors) */}
          {activeTab === "doctors" && (
            <div className="flex gap-2 overflow-x-auto pb-1 scroll-hide">
              {allSpecialties.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => setActiveSpecialty(s.slug)}
                  className={cn(
                    "whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0",
                    activeSpecialty === s.slug
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700"
                  )}
                >
                  {s.nameBn}
                </button>
              ))}
            </div>
          )}

          {/* Category chips (tests) */}
          {activeTab === "tests" && (
            <div className="flex gap-2 overflow-x-auto pb-1 scroll-hide">
              {TEST_CATEGORIES.map((c) => (
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
          )}

          {/* Doctor extra filters */}
          {activeTab === "doctors" && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl hover:bg-gray-100"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                ফিল্টার
                {(gender || sort) && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 ml-0.5" />}
                <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
              </button>

              {/* Quick sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="ml-auto text-[12px] text-gray-600 bg-gray-50 border-0 rounded-xl px-2 py-1.5 outline-none cursor-pointer"
              >
                <option value="">রেটিং অনুযায়ী</option>
                <option value="fee_asc">ফি (কম→বেশি)</option>
                <option value="fee_desc">ফি (বেশি→কম)</option>
                <option value="experience">অভিজ্ঞতা</option>
              </select>

              {(gender || sort) && (
                <button
                  onClick={() => { setGender(""); setSort(""); }}
                  className="text-[11px] text-red-500 font-medium px-2 py-1"
                >
                  রিসেট
                </button>
              )}
            </div>
          )}

          {/* Expanded filters panel */}
          {activeTab === "doctors" && showFilters && (
            <div className="mt-2 pt-2 border-t border-gray-50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">লিঙ্গ</p>
              <div className="flex gap-2">
                {[{ value: "", label: "সবাই" }, { value: "MALE", label: "পুরুষ" }, { value: "FEMALE", label: "মহিলা" }].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGender(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all",
                      gender === opt.value ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between py-3 px-1">
          <p className="text-[13px] text-gray-500">
            {loading ? "খুঁজছে..." : (
              activeTab === "doctors"
                ? <><span className="font-bold text-gray-900">{doctors.length}</span> জন ডাক্তার পাওয়া গেছে</>
                : <><span className="font-bold text-gray-900">{tests.length}</span>টি টেস্ট পাওয়া গেছে</>
            )}
          </p>
          {activeTab === "doctors" && (
            <Link href="/doctors" className="text-[12px] font-semibold text-teal-600">
              সব দেখুন →
            </Link>
          )}
          {activeTab === "tests" && (
            <Link href="/tests" className="text-[12px] font-semibold text-teal-600">
              সব দেখুন →
            </Link>
          )}
        </div>

        {/* ── DOCTOR LIST ── */}
        {activeTab === "doctors" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <DoctorSkeleton key={i} />)
              : doctors.length === 0
              ? (
                <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Stethoscope className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <h3 className="font-semibold text-gray-600 mb-1">কোনো ডাক্তার পাওয়া যায়নি</h3>
                  <p className="text-sm text-gray-400">সময়সূচি বা লোকেশন যোগ করা নেই এমন ডাক্তার দেখাচ্ছে না</p>
                </div>
              )
              : doctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  todaySchedule={doctor.todaySchedule}
                  todayQueue={doctor.todayQueue}
                />
              ))
            }
          </div>
        )}

        {/* ── TEST LIST ── */}
        {activeTab === "tests" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                ))
              : tests.length === 0
              ? (
                <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <h3 className="font-semibold text-gray-600 mb-1">কোনো টেস্ট পাওয়া যায়নি</h3>
                  <p className="text-sm text-gray-400">ডায়াগনস্টিক সেন্টারগুলো এখনো টেস্ট যোগ করেনি</p>
                </div>
              )
              : tests.map((test) => <TestCard key={test.id} test={test} />)
            }
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-6 justify-center py-6 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{stats[0]}+</div>
            <div className="text-[11px] text-gray-400">যাচাইকৃত ডাক্তার</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{stats[1]}+</div>
            <div className="text-[11px] text-gray-400">ডায়াগনস্টিক সেন্টার</div>
          </div>
        </div>
      </div>
    </div>
  );
}
