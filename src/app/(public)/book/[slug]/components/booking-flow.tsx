"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  ChevronRight,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatTime, getDayName, getTodayDateString } from "@/lib/utils";

type Chamber = {
  id: string;
  nameBn: string;
  address: string;
  appointmentType: string;
  slotDuration: number;
  dailyLimit: number;
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
};

type Doctor = {
  id: string;
  slug: string;
  nameBn: string;
  photo?: string | null;
  consultationFee: number;
  chambers: Chamber[];
  specialties: { specialty: { nameBn: string } }[];
};

type Patient = {
  id: string;
  nameBn?: string | null;
  nameEn?: string | null;
};

type BookingFlowProps = {
  doctor: Doctor;
  patient: Patient;
  preselectedChamberId?: string;
  preselectedDate?: string;
};

function getNextNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function BookingFlow({ doctor, patient, preselectedChamberId, preselectedDate }: BookingFlowProps) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedChamber, setSelectedChamber] = useState<Chamber>(
    doctor.chambers.find((c) => c.id === preselectedChamberId) ?? doctor.chambers[0]
  );
  const [selectedDate, setSelectedDate] = useState(preselectedDate ?? getTodayDateString());
  const [patientNote, setPatientNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<{ serialNumber: number; appointmentId: string } | null>(null);

  const availableDates = getNextNDays(14).filter((dateStr) => {
    const day = new Date(dateStr).getDay();
    return selectedChamber.schedules.some((s) => s.dayOfWeek === day);
  });

  const selectedDateSchedule = selectedChamber.schedules.find(
    (s) => s.dayOfWeek === new Date(selectedDate).getDay()
  );

  const handleBook = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chamberId: selectedChamber.id,
          date: selectedDate,
          patientNote: patientNote || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "সিরিয়াল নেওয়া যায়নি");
        return;
      }

      setBooked({ serialNumber: data.appointment.serialNumber, appointmentId: data.appointment.id });
      setStep(4);
    } catch {
      setError("একটি সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (step === 4 && booked) {
    return (
      <div className="text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">সিরিয়াল নিশ্চিত!</h2>
          <p className="text-gray-500 mb-6">
            আপনার সিরিয়াল সফলভাবে নেওয়া হয়েছে
          </p>

          <div className="bg-teal-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-teal-600 mb-1">আপনার সিরিয়াল নম্বর</p>
            <div className="text-5xl font-bold text-teal-700">#{booked.serialNumber}</div>
          </div>

          <div className="text-left bg-gray-50 rounded-xl p-4 space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ডাক্তার</span>
              <span className="font-medium text-gray-900">{doctor.nameBn}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">চেম্বার</span>
              <span className="font-medium text-gray-900">{selectedChamber.nameBn}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">তারিখ</span>
              <span className="font-medium text-gray-900">{selectedDate}</span>
            </div>
            {selectedDateSchedule && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">সময়</span>
                <span className="font-medium text-gray-900">
                  {formatTime(selectedDateSchedule.startTime)} — {formatTime(selectedDateSchedule.endTime)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => router.push(`/appointment/${booked.appointmentId}/queue`)}
            >
              লাইভ কিউ দেখুন
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
            >
              ড্যাশবোর্ড
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Doctor header */}
      <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <Avatar className="h-16 w-16 rounded-2xl">
          <AvatarImage src={doctor.photo ?? ""} alt={doctor.nameBn} />
          <AvatarFallback className="rounded-2xl text-xl">{doctor.nameBn.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{doctor.nameBn}</h1>
          {doctor.specialties[0] && (
            <p className="text-sm text-teal-600">{doctor.specialties[0].specialty.nameBn}</p>
          )}
          <p className="text-sm text-gray-500 mt-0.5">
            ভিজিট ফি: {formatCurrency(doctor.consultationFee)}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {["চেম্বার", "তারিখ", "নিশ্চিত"].map((label, idx) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step > idx + 1
                  ? "bg-teal-600 text-white"
                  : step === idx + 1
                  ? "bg-teal-100 text-teal-700 border-2 border-teal-500"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > idx + 1 ? "✓" : idx + 1}
            </div>
            <span className={`text-xs font-medium ${step === idx + 1 ? "text-teal-700" : "text-gray-400"}`}>
              {label}
            </span>
            {idx < 2 && <div className={`flex-1 h-px ${step > idx + 1 ? "bg-teal-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Chamber */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>চেম্বার বেছে নিন</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {doctor.chambers.map((chamber) => (
              <button
                key={chamber.id}
                onClick={() => setSelectedChamber(chamber)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedChamber.id === chamber.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-teal-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{chamber.nameBn}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{chamber.address}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {chamber.schedules.map((s) => (
                        <span key={s.dayOfWeek} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {getDayName(s.dayOfWeek, "bn")} {formatTime(s.startTime)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            <Button className="w-full mt-2" onClick={() => setStep(2)}>
              পরবর্তী <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>তারিখ বেছে নিন</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">
              পরবর্তী ১৪ দিনের মধ্যে চেম্বারের দিনগুলো
            </p>
            {availableDates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                পরবর্তী ১৪ দিনে এই চেম্বারের কোনো দিন নেই
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableDates.map((date) => {
                  const day = new Date(date).getDay();
                  const dayName = getDayName(day);
                  const sched = selectedChamber.schedules.find((s) => s.dayOfWeek === day);
                  const isToday = date === getTodayDateString();
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        selectedDate === date
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-teal-500" />
                        <span className="text-xs font-semibold text-gray-800">{dayName}</span>
                        {isToday && (
                          <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 rounded-full">আজ</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{date}</p>
                      {sched && (
                        <p className="text-[11px] text-teal-600 mt-1">
                          {formatTime(sched.startTime)}–{formatTime(sched.endTime)}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>পূর্ববর্তী</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={!selectedDate}>
                পরবর্তী <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>সিরিয়াল নিশ্চিত করুন</CardTitle></CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 mb-4">
                {error}
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">ডাক্তার</p>
                  <p className="text-sm font-semibold text-gray-900">{doctor.nameBn}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">চেম্বার</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedChamber.nameBn}</p>
                  <p className="text-xs text-gray-500">{selectedChamber.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">তারিখ</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedDate}</p>
                </div>
              </div>
              {selectedDateSchedule && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">সময়</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatTime(selectedDateSchedule.startTime)} — {formatTime(selectedDateSchedule.endTime)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">ভিজিট ফি</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(doctor.consultationFee)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                নোট (ঐচ্ছিক)
              </label>
              <textarea
                placeholder="আপনার সমস্যা বা বিশেষ তথ্য লিখুন..."
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                className="w-full h-24 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>পূর্ববর্তী</Button>
              <Button className="flex-1" onClick={handleBook} loading={loading}>
                <CheckCircle className="h-4 w-4" />
                সিরিয়াল নিন
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
