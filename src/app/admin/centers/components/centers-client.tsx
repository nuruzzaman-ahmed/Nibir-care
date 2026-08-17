"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, FlaskConical, CheckCircle2, Ban, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type CenterRow = {
  id: string;
  nameBn: string;
  nameEn: string;
  email: string | null;
  phone: string | null;
  district: string;
  serviceCount: number;
  verificationStatus: string;
  createdAt: Date;
  subscriptionActive: boolean;
  plan: string | null;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "অপেক্ষারত", cls: "bg-amber-50 text-amber-700" },
  UNDER_REVIEW: { label: "পর্যালোচনা", cls: "bg-blue-50 text-blue-700" },
  VERIFIED: { label: "যাচাইকৃত", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700" },
  SUSPENDED: { label: "স্থগিত", cls: "bg-gray-200 text-gray-700" },
};

const STATUS_FILTERS = [
  { value: "ALL", label: "সব" },
  { value: "PENDING", label: "অপেক্ষারত" },
  { value: "UNDER_REVIEW", label: "পর্যালোচনা" },
  { value: "VERIFIED", label: "যাচাইকৃত" },
  { value: "REJECTED", label: "প্রত্যাখ্যাত" },
  { value: "SUSPENDED", label: "স্থগিত" },
];

export function AdminCentersClient({ centers: initialCenters }: { centers: CenterRow[] }) {
  const [centers, setCenters] = useState(initialCenters);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = centers.filter((c) => {
    const matchStatus = statusFilter === "ALL" || c.verificationStatus === statusFilter;
    const matchSearch =
      !search ||
      c.nameBn.includes(search) ||
      c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const quickAction = async (id: string, action: "VERIFY" | "SUSPEND") => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "DIAGNOSTIC", entityId: id, action }),
      });
      if (res.ok) {
        const newStatus = action === "VERIFY" ? "VERIFIED" : "SUSPENDED";
        setCenters((prev) => prev.map((c) => (c.id === id ? { ...c, verificationStatus: newStatus } : c)));
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">ডায়াগনস্টিক সেন্টার</h1>
        <p className="text-sm text-gray-500 mt-0.5">{centers.length} টি নিবন্ধিত সেন্টার</p>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="নাম বা ইমেইল খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto scroll-hide mb-5 pb-1">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={cn(
              "whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0",
              statusFilter === s.value ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো সেন্টার পাওয়া যায়নি</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const meta = STATUS_META[c.verificationStatus] ?? { label: c.verificationStatus, cls: "bg-gray-100 text-gray-600" };
            const isUpdating = updating === c.id;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.nameBn}</p>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", meta.cls)}>
                      {meta.label}
                    </span>
                    {c.plan && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                          c.subscriptionActive ? "bg-purple-50 text-purple-700" : "bg-red-100 text-red-600"
                        )}
                      >
                        {c.plan} {c.subscriptionActive ? "" : "(মেয়াদোত্তীর্ণ)"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {c.district} · {c.serviceCount} টি সেবা
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.verificationStatus !== "VERIFIED" && (
                    <button
                      onClick={() => quickAction(c.id, "VERIFY")}
                      disabled={isUpdating}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                      title="দ্রুত যাচাই করুন"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {c.verificationStatus === "VERIFIED" && (
                    <button
                      onClick={() => quickAction(c.id, "SUSPEND")}
                      disabled={isUpdating}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-40"
                      title="স্থগিত করুন"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <Link
                    href={`/admin/verify/center/${c.id}`}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    title="বিস্তারিত দেখুন"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
