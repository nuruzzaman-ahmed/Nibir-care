"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, SlidersHorizontal, Stethoscope } from "lucide-react";
import { DoctorCard } from "@/components/shared/doctor-card";
import { cn } from "@/lib/utils";

type Specialty = { id: string; slug: string; nameBn: string };

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

function Skeleton() {
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

export function DoctorsClient({ specialties }: { specialties: Specialty[] }) {
  const [searchQuery, setSearchQuery]         = useState("");
  const [activeSpecialty, setActiveSpecialty] = useState("all");
  const [gender, setGender]                   = useState("");
  const [sort, setSort]                       = useState("");
  const [showFilters, setShowFilters]         = useState(false);
  const [doctors, setDoctors]                 = useState<Doctor[]>([]);
  const [loading, setLoading]                 = useState(true);
  const debounceRef                           = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchDoctors = useCallback(async (q: string, specialty: string, g: string, s: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (specialty && specialty !== "all") params.set("specialty", specialty);
    if (g) params.set("gender", g);
    if (s) params.set("sort", s);
    try {
      const res  = await fetch(`/api/public/doctors?${params}`);
      const data = await res.json();
      setDoctors(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDoctors(searchQuery, activeSpecialty, gender, sort);
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, activeSpecialty, gender, sort, fetchDoctors]);

  const allSpecialties = [{ id: "all", slug: "all", nameBn: "সব" }, ...specialties];
  const hasFilters     = !!(gender || sort || (activeSpecialty && activeSpecialty !== "all"));

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-gray-100 sticky top-14 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ডাক্তার, বিশেষত্ব বা এলাকা..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-teal-300 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Specialty chips */}
          <div className="flex gap-2 overflow-x-auto scroll-hide pb-0.5">
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

          {/* Filter row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-xl transition-all",
                showFilters ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              ফিল্টার
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />}
            </button>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="ml-auto text-[12px] text-gray-600 bg-gray-100 border-0 rounded-xl px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value="">রেটিং অনুযায়ী</option>
              <option value="fee_asc">ফি (কম→বেশি)</option>
              <option value="fee_desc">ফি (বেশি→কম)</option>
              <option value="experience">অভিজ্ঞতা</option>
            </select>

            {hasFilters && (
              <button
                onClick={() => { setGender(""); setSort(""); setActiveSpecialty("all"); }}
                className="text-[11px] text-red-500 font-medium px-2 py-1"
              >
                রিসেট
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="pt-2 border-t border-gray-50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">লিঙ্গ</p>
              <div className="flex gap-2">
                {[
                  { value: "", label: "সবাই" },
                  { value: "MALE", label: "পুরুষ" },
                  { value: "FEMALE", label: "মহিলা" },
                ].map((opt) => (
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
      </div>

      {/* ── RESULTS ── */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <p className="text-[13px] text-gray-500 mb-4">
          {loading ? "খুঁজছে..." : <><span className="font-bold text-gray-900">{doctors.length}</span> জন ডাক্তার পাওয়া গেছে</>}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
            : doctors.length === 0
            ? (
              <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-gray-100">
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
      </div>
    </div>
  );
}
