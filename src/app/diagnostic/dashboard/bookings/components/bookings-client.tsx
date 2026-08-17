"use client";

import { useState } from "react";
import {
  FlaskConical,
  Search,
  CalendarCheck,
  UserPlus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Booking = {
  id: string;
  bookingRef: string;
  patientName: string;
  patientPhone: string;
  patientAge: number | null;
  patientGender: string | null;
  date: string;
  timeSlot: string | null;
  status: string;
  totalPrice: number;
  notes: string | null;
  createdAt: Date;
  service: { nameBn: string; category: string | null };
  patient: { nameBn: string | null } | null;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "সব" },
  { value: "PENDING", label: "অপেক্ষারত" },
  { value: "CONFIRMED", label: "নিশ্চিত" },
  { value: "PROCESSING", label: "প্রক্রিয়াধীন" },
  { value: "COMPLETED", label: "সম্পন্ন" },
  { value: "CANCELLED", label: "বাতিল" },
];

const STATUS_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  PENDING: [
    { value: "CONFIRMED", label: "✓ নিশ্চিত করুন" },
    { value: "CANCELLED", label: "✕ বাতিল করুন" },
  ],
  CONFIRMED: [
    { value: "PROCESSING", label: "→ প্রক্রিয়া শুরু" },
    { value: "CANCELLED", label: "✕ বাতিল করুন" },
  ],
  PROCESSING: [
    { value: "COMPLETED", label: "✓ সম্পন্ন" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

const statusMeta: Record<string, { label: string; variant: "default" | "success" | "destructive" | "warning" | "current" }> = {
  PENDING: { label: "অপেক্ষারত", variant: "warning" },
  CONFIRMED: { label: "নিশ্চিত", variant: "default" },
  PROCESSING: { label: "প্রক্রিয়াধীন", variant: "current" },
  COMPLETED: { label: "সম্পন্ন", variant: "success" },
  CANCELLED: { label: "বাতিল", variant: "destructive" },
};

type Service = { id: string; nameBn: string; price: number };
type WalkinForm = { patientName: string; patientPhone: string; serviceId: string; date: string; timeSlot: string };

export function BookingsClient({
  bookings: initialBookings,
  centerId,
  services,
}: {
  bookings: Booking[];
  centerId: string;
  services: Service[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Walk-in modal
  const today = new Date().toISOString().split("T")[0];
  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinForm, setWalkinForm] = useState<WalkinForm>({
    patientName: "",
    patientPhone: "",
    serviceId: services[0]?.id ?? "",
    date: today,
    timeSlot: "",
  });
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [walkinError, setWalkinError] = useState("");
  const [walkinSuccess, setWalkinSuccess] = useState("");

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.patientName.trim()) { setWalkinError("রোগীর নাম দিন"); return; }
    if (!walkinForm.serviceId) { setWalkinError("পরীক্ষা বেছে নিন"); return; }
    setWalkinLoading(true);
    setWalkinError("");
    setWalkinSuccess("");
    try {
      const res = await fetch("/api/test-booking/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...walkinForm, centerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWalkinError(data.error ?? "বুকিং যোগ করতে সমস্যা হয়েছে");
      } else {
        setWalkinSuccess(`বুকিং সফল! রেফারেন্স: ${data.bookingRef}`);
        setWalkinForm({ patientName: "", patientPhone: "", serviceId: services[0]?.id ?? "", date: today, timeSlot: "" });
        // Optimistically add to list
        setBookings((prev) => [data, ...prev]);
        setTimeout(() => { setShowWalkin(false); setWalkinSuccess(""); }, 1800);
      }
    } finally {
      setWalkinLoading(false);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === "ALL" || b.status === filter;
    const matchSearch =
      !search ||
      b.patientName.toLowerCase().includes(search.toLowerCase()) ||
      b.service.nameBn.includes(search) ||
      b.bookingRef.includes(search) ||
      b.patientPhone.includes(search);
    return matchStatus && matchSearch;
  });

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId);
    try {
      const res = await fetch(`/api/diagnostic/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  const stats = {
    pending: bookings.filter((b) => b.status === "PENDING").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    processing: bookings.filter((b) => b.status === "PROCESSING").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">টেস্ট বুকিং</h1>
          <p className="text-sm text-gray-500 mt-0.5">সব রোগীর টেস্ট বুকিং পরিচালনা করুন</p>
        </div>
        {services.length > 0 && (
          <Button
            size="sm"
            onClick={() => setShowWalkin(true)}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] h-8 px-3"
          >
            <UserPlus className="h-3.5 w-3.5" />
            বুকিং যোগ করুন
          </Button>
        )}
      </div>

      {/* Walk-in modal */}
      {showWalkin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-down">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">ওয়াক-ইন বুকিং যোগ করুন</h2>
                <p className="text-xs text-gray-400 mt-0.5">সরাসরি আসা রোগীর বুকিং</p>
              </div>
              <button onClick={() => { setShowWalkin(false); setWalkinError(""); setWalkinSuccess(""); }}
                className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">পরীক্ষার নাম *</label>
                <select
                  value={walkinForm.serviceId}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, serviceId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.nameBn} — {formatCurrency(s.price)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">রোগীর নাম *</label>
                <input
                  type="text"
                  placeholder="রোগীর নাম লিখুন..."
                  value={walkinForm.patientName}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, patientName: e.target.value }))}
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ফোন নম্বর</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={walkinForm.patientPhone}
                  onChange={(e) => setWalkinForm((f) => ({ ...f, patientPhone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">তারিখ</label>
                  <input
                    type="date"
                    value={walkinForm.date}
                    min={today}
                    onChange={(e) => setWalkinForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">সময়</label>
                  <input
                    type="time"
                    value={walkinForm.timeSlot}
                    onChange={(e) => setWalkinForm((f) => ({ ...f, timeSlot: e.target.value }))}
                    className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {walkinError && (
                <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{walkinError}</p>
              )}
              {walkinSuccess && (
                <p className="text-[12px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 font-semibold">{walkinSuccess}</p>
              )}

              <Button type="submit" className="w-full gap-2 h-10 bg-blue-600 hover:bg-blue-700" disabled={walkinLoading}>
                <UserPlus className="h-4 w-4" />
                {walkinLoading ? "যোগ হচ্ছে..." : "বুকিং নিশ্চিত করুন"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
          ⏳ অপেক্ষারত: {stats.pending}
        </span>
        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          ✓ নিশ্চিত: {stats.confirmed}
        </span>
        <span className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
          ⟳ প্রক্রিয়াধীন: {stats.processing}
        </span>
        <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          ✅ সম্পন্ন: {stats.completed}
        </span>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="নাম, ফোন, রেফারেন্স, পরীক্ষা খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো বুকিং পাওয়া যায়নি</h3>
          <p className="text-sm text-gray-400">অনুসন্ধান বা ফিল্টার পরিবর্তন করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const s = statusMeta[booking.status] ?? { label: booking.status, variant: "default" as const };
            const transitions = STATUS_TRANSITIONS[booking.status] ?? [];
            const isUpdating = updating === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FlaskConical className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{booking.patientName}</p>
                      <p className="text-xs text-gray-400">{booking.patientPhone}</p>
                    </div>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">পরীক্ষা</span>
                    <span className="font-semibold text-gray-900">{booking.service.nameBn}</span>
                  </div>
                  {booking.service.category && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">বিভাগ</span>
                      <span className="text-gray-700">{booking.service.category}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">তারিখ</span>
                    <span className="text-gray-700">{booking.date}</span>
                  </div>
                  {booking.timeSlot && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">সময়</span>
                      <span className="text-gray-700">{booking.timeSlot}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">মূল্য</span>
                    <span className="font-bold text-teal-700">{formatCurrency(booking.totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">রেফারেন্স</span>
                    <span className="text-gray-400 font-mono">{booking.bookingRef.slice(-8)}</span>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-xs text-gray-500 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                    📝 {booking.notes}
                  </p>
                )}

                {/* Action buttons */}
                {transitions.length > 0 && (
                  <div className="flex gap-2">
                    {transitions.map((t) => (
                      <Button
                        key={t.value}
                        size="sm"
                        variant={t.value === "CANCELLED" ? "destructive" : t.value === "COMPLETED" ? "default" : "outline"}
                        className={`flex-1 text-xs ${t.value === "COMPLETED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(booking.id, t.value)}
                      >
                        {isUpdating ? "..." : t.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
