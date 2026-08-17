"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  nameBn: string;
  nameEn: string;
  price: number;
  discountPrice: number | null;
  reportTime: string | null;
  preparation: string | null;
  category: string | null;
};

const TIME_SLOTS = [
  "৮:০০ সকাল", "৯:০০ সকাল", "১০:০০ সকাল", "১১:০০ সকাল",
  "১২:০০ দুপুর", "২:০০ বিকাল", "৩:০০ বিকাল", "৪:০০ বিকাল",
  "৫:০০ বিকাল", "৬:০০ সন্ধ্যা",
];

export function TestBookingPanel({
  centerId,
  services,
  isLoggedIn,
  defaultPatientName,
  defaultPatientPhone,
}: {
  centerId: string;
  services: Service[];
  isLoggedIn: boolean;
  defaultPatientName?: string;
  defaultPatientPhone?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"service" | "details" | "done">("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [patientName, setPatientName] = useState(defaultPatientName ?? "");
  const [patientPhone, setPatientPhone] = useState(defaultPatientPhone ?? "");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const handleBook = async () => {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!selectedService || !date || !patientName || !patientPhone) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/test-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centerId,
          serviceId: selectedService.id,
          date,
          timeSlot: timeSlot || undefined,
          patientName,
          patientPhone,
          patientAge: patientAge ? parseInt(patientAge) : undefined,
          patientGender: patientGender || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        return;
      }

      setBookingRef(data.bookingRef);
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <div className="text-center py-4">
        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="font-bold text-gray-900 mb-1">বুকিং সম্পন্ন!</h3>
        <p className="text-xs text-gray-500 mb-2">
          নিশ্চিতকরণের জন্য অপেক্ষা করুন।
        </p>
        <p className="text-[10px] text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
          রেফারেন্স: {bookingRef.slice(-8).toUpperCase()}
        </p>
        <div className="mt-4 space-y-2">
          <Button
            size="sm"
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            ড্যাশবোর্ডে যান
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => { setStep("service"); setSelectedService(null); setDate(""); setTimeSlot(""); }}
          >
            আরেকটি টেস্ট বুক করুন
          </Button>
        </div>
      </div>
    );
  }

  if (step === "service") {
    return (
      <div>
        <h3 className="font-bold text-gray-900 mb-3">টেস্ট বুক করুন</h3>
        <p className="text-xs text-gray-500 mb-3">পরীক্ষা বেছে নিন</p>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedService(s); setStep("details"); }}
              className="w-full text-left flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FlaskConical className="h-4 w-4 text-teal-500 shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">{s.nameBn}</span>
              </div>
              <span className="text-sm font-bold text-gray-900 ml-2 shrink-0">
                {formatCurrency(s.discountPrice ?? s.price)}
              </span>
            </button>
          ))}
        </div>

        {!isLoggedIn && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mt-3">
            বুক করতে লগইন করতে হবে।
          </p>
        )}
      </div>
    );
  }

  // Details step
  return (
    <div>
      <button
        onClick={() => setStep("service")}
        className="text-xs text-teal-600 mb-3 hover:underline flex items-center gap-1"
      >
        ← পরীক্ষা পরিবর্তন করুন
      </button>

      {selectedService && (
        <div className="bg-teal-50 rounded-xl p-3 mb-4">
          <p className="text-sm font-bold text-gray-900">{selectedService.nameBn}</p>
          <p className="text-xs text-teal-700 mt-0.5">
            মূল্য: {formatCurrency(selectedService.discountPrice ?? selectedService.price)}
          </p>
          {selectedService.preparation && (
            <p className="text-xs text-gray-500 mt-1">📋 {selectedService.preparation}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">তারিখ *</label>
          <input
            type="date"
            min={today}
            max={maxDateStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">সময় (ঐচ্ছিক)</label>
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">সময় বাছুন</option>
            {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">রোগীর নাম *</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="পুরো নাম"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
          <input
            type="tel"
            value={patientPhone}
            onChange={(e) => setPatientPhone(e.target.value)}
            placeholder="+৮৮০১৮..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">বয়স</label>
            <input
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder="৩৫"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">লিঙ্গ</label>
            <select
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">বাছুন</option>
              <option value="MALE">পুরুষ</option>
              <option value="FEMALE">মহিলা</option>
              <option value="OTHER">অন্য</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">বিশেষ মন্তব্য</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="কোনো বিশেষ তথ্য..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <Button
          onClick={handleBook}
          disabled={submitting || !date || !patientName || !patientPhone}
          loading={submitting}
          className="w-full"
        >
          {isLoggedIn ? "টেস্ট বুক করুন" : "লগইন করে বুক করুন"}
        </Button>
      </div>
    </div>
  );
}
