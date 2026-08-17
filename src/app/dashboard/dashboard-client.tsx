"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Stethoscope,
  FlaskConical,
  FileText,
  Bell,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  Pill,
  ArrowRight,
  Phone,
  Search,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsClient } from "../(public)/notifications/components/notifications-client";
import { cn, minutesToDisplay, formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────
type Specialty = { specialty: { nameBn: string } };

type Appointment = {
  id: string;
  serialNumber: number;
  status: string;
  date: string;
  slotTime?: string | null;
  doctor: { nameBn: string; photo?: string | null; specialties: Specialty[] };
  chamber: { nameBn: string; address?: string };
  queue?: {
    id: string;
    currentSerial: number;
    status: string;
    avgConsultDuration: number;
    doctorDelayMinutes: number;
    note?: string | null;
    updatedAt: string | Date;
  } | null;
  prescription?: { id: string } | null;
};

type TestBooking = {
  id: string;
  bookingRef: string;
  status: string;
  date: string;
  timeSlot?: string | null;
  totalPrice: number;
  service: { nameBn: string; nameEn: string; category?: string | null; reportTime?: string | null };
  center: { nameBn: string; slug: string; district: string; thana?: string | null; phone?: string | null };
};

type NotificationT = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
};

type PrescriptionItem = { id: string; medicineName: string };
type Prescription = {
  id: string;
  diagnosis?: string | null;
  createdAt: Date | string;
  doctor: { nameBn: string; specialties: Specialty[] };
  appointment: { date: string; serialNumber: number };
  items: PrescriptionItem[];
};

type Tab = "overview" | "appointments" | "tests" | "prescriptions" | "notifications";

// ── Helpers ────────────────────────────────────────────────────
function patientsAhead(patientSerial: number, currentSerial: number): number {
  return Math.max(0, patientSerial - currentSerial - 1);
}
function etaCalc(ahead: number, avgDuration: number, delay: number): number {
  return ahead * avgDuration + delay;
}

const TEST_STATUS_LABEL: Record<string, { label: string; variant: string }> = {
  PENDING: { label: "অপেক্ষমান", variant: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "নিশ্চিত", variant: "bg-blue-50 text-blue-700 border-blue-200" },
  PROCESSING: { label: "প্রক্রিয়াধীন", variant: "bg-purple-50 text-purple-700 border-purple-200" },
  COMPLETED: { label: "সম্পন্ন", variant: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "বাতিল", variant: "bg-red-50 text-red-700 border-red-200" },
};

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all shrink-0",
        active ? "bg-teal-600 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {typeof count === "number" && count > 0 && (
        <span
          className={cn(
            "min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center",
            active ? "bg-white/25 text-white" : "bg-teal-50 text-teal-700"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-extrabold text-gray-900 leading-none">{value}</p>
      <p className="text-[11px] text-gray-400 mt-1">{label}</p>
    </button>
  );
}

function AppointmentCard({ appt, live }: { appt: Appointment; live?: boolean }) {
  const isCurrent = appt.status === "CURRENT";
  const queue = appt.queue;
  const ahead = queue ? patientsAhead(appt.serialNumber, queue.currentSerial) : 0;
  const eta = queue ? etaCalc(ahead, queue.avgConsultDuration, queue.doctorDelayMinutes) : 0;
  const specialty = appt.doctor.specialties[0]?.specialty.nameBn ?? "";

  return (
    <div className={cn("rounded-2xl border shadow-sm p-4 transition-all", isCurrent ? "border-teal-300 bg-teal-50" : "bg-white border-gray-100")}>
      <div className="flex items-start gap-3">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", isCurrent ? "bg-teal-100" : "bg-gray-100")}>
          <Stethoscope className={cn("h-5 w-5", isCurrent ? "text-teal-600" : "text-gray-500")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{appt.doctor.nameBn}</p>
              <p className="text-xs text-teal-600 truncate">{specialty}</p>
            </div>
            {live && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 shrink-0">
                <Radio className="h-3 w-3 animate-pulse" />
                লাইভ
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {appt.chamber.nameBn}
          </p>

          {queue && (
            <div className="mt-3 bg-white rounded-xl p-3 border border-gray-100">
              {isCurrent ? (
                <p className="text-sm font-bold text-teal-700 text-center">🎉 আপনার পালা এসেছে!</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">#{appt.serialNumber}</p>
                    <p className="text-[10px] text-gray-400">আপনার নম্বর</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{ahead} জন</p>
                    <p className="text-[10px] text-gray-400">আগে আছেন</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">~{minutesToDisplay(eta)}</p>
                    <p className="text-[10px] text-gray-400">অনুমানিত</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Link href={`/appointment/${appt.id}/queue`}>
            <Button className="w-full mt-3" size="sm">
              লাইভ কিউ দেখুন
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TestBookingCard({ booking }: { booking: TestBooking }) {
  const statusInfo = TEST_STATUS_LABEL[booking.status] ?? TEST_STATUS_LABEL.PENDING;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{booking.service.nameBn || booking.service.nameEn}</p>
            <p className="text-xs text-gray-500 truncate">{booking.center.nameBn}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {booking.date}
              </span>
              {booking.timeSlot && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {booking.timeSlot}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={cn("shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full border", statusInfo.variant)}>
          {statusInfo.label}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <div className="text-[11px] text-gray-400">
          রেফ: <span className="font-mono text-gray-600">{booking.bookingRef.slice(0, 8).toUpperCase()}</span>
        </div>
        <p className="text-[16px] font-extrabold text-gray-900">{formatCurrency(booking.totalPrice)}</p>
      </div>

      {booking.center.phone && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
        <a
          href={`tel:${booking.center.phone}`}
          className="mt-2 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-blue-600 bg-blue-50 py-2 rounded-xl"
        >
          <Phone className="h-3.5 w-3.5" />
          সেন্টারে কল করুন
        </a>
      )}
    </div>
  );
}

function PrescriptionPreviewCard({ rx }: { rx: Prescription }) {
  return (
    <Link
      href={`/my/prescriptions/${rx.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Stethoscope className="h-5 w-5 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-[14px] truncate">{rx.doctor.nameBn}</p>
            <p className="text-[12px] text-teal-600 truncate">{rx.doctor.specialties[0]?.specialty.nameBn ?? ""}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {rx.appointment.date}
              </span>
              <span>সিরিয়াল #{rx.appointment.serialNumber}</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
      </div>
      {rx.diagnosis && (
        <p className="mt-3 text-[12px] text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 truncate">Dx: {rx.diagnosis}</p>
      )}
      {rx.items.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {rx.items.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
              <Pill className="h-2.5 w-2.5" />
              {item.medicineName.split(" ").slice(0, 2).join(" ")}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────
export function DashboardClient({
  patientName,
  initialActiveAppointments,
  initialPastAppointments,
  initialTestBookings,
  initialNotifications,
  initialPrescriptions,
  prescriptionCount,
  userId,
}: {
  patientName: string;
  initialActiveAppointments: Appointment[];
  initialPastAppointments: Appointment[];
  initialTestBookings: TestBooking[];
  initialNotifications: NotificationT[];
  initialPrescriptions: Prescription[];
  prescriptionCount: number;
  userId: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [activeAppointments, setActiveAppointments] = useState(initialActiveAppointments);
  const [pastAppointments] = useState(initialPastAppointments);
  const [testBookings, setTestBookings] = useState(initialTestBookings);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const unreadCount = initialNotifications.filter((n) => !n.isRead).length;
  const activeTestCount = testBookings.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED").length;

  // ── Live polling for active appointments (queue status) ──
  const refreshAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/patient/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setActiveAppointments(data.active ?? []);
    } catch {
      /* ignore transient network errors */
    }
  }, []);

  useEffect(() => {
    const hasLiveAppt = activeAppointments.some((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED");
    if (tab === "appointments" && hasLiveAppt) {
      pollRef.current = setInterval(refreshAppointments, 10000);
    }
    return () => clearInterval(pollRef.current);
  }, [tab, activeAppointments, refreshAppointments]);

  // ── Light refresh for test bookings when that tab opens ──
  const refreshTests = useCallback(async () => {
    try {
      const res = await fetch("/api/patient/test-bookings");
      if (!res.ok) return;
      const data = await res.json();
      setTestBookings(data ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (tab === "tests") refreshTests();
  }, [tab, refreshTests]);

  const nextAppointment = useMemo(() => activeAppointments[0] ?? null, [activeAppointments]);
  const nextTestBooking = useMemo(
    () => testBookings.find((b) => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "PROCESSING") ?? null,
    [testBookings]
  );

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-5">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">স্বাগতম, {patientName}!</h1>
        <p className="text-sm text-gray-500">আপনার স্বাস্থ্যসেবা ড্যাশবোর্ড</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <StatCard icon={Stethoscope} label="সক্রিয় সিরিয়াল" value={activeAppointments.length} color="bg-teal-50 text-teal-600" onClick={() => setTab("appointments")} />
        <StatCard icon={FlaskConical} label="টেস্ট বুকিং" value={activeTestCount} color="bg-blue-50 text-blue-600" onClick={() => setTab("tests")} />
        <StatCard icon={FileText} label="প্রেসক্রিপশন" value={prescriptionCount} color="bg-purple-50 text-purple-600" onClick={() => setTab("prescriptions")} />
        <StatCard icon={Bell} label="নোটিফিকেশন" value={unreadCount} color="bg-amber-50 text-amber-600" onClick={() => setTab("notifications")} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto scroll-hide mb-5 pb-1">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={Radio} label="ওভারভিউ" />
        <TabButton active={tab === "appointments"} onClick={() => setTab("appointments")} icon={Stethoscope} label="সিরিয়াল" count={activeAppointments.length} />
        <TabButton active={tab === "tests"} onClick={() => setTab("tests")} icon={FlaskConical} label="টেস্ট বুকিং" count={activeTestCount} />
        <TabButton active={tab === "prescriptions"} onClick={() => setTab("prescriptions")} icon={FileText} label="প্রেসক্রিপশন" count={prescriptionCount} />
        <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")} icon={Bell} label="নোটিফিকেশন" count={unreadCount} />
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {nextAppointment && (
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2">পরবর্তী সিরিয়াল</h2>
              <AppointmentCard appt={nextAppointment} />
            </div>
          )}

          {nextTestBooking && (
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2">আসন্ন টেস্ট বুকিং</h2>
              <TestBookingCard booking={nextTestBooking} />
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/doctors">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                  <Search className="h-5 w-5 text-teal-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">ডাক্তার খুঁজুন</p>
                <p className="text-xs text-gray-400 mt-0.5">সিরিয়াল নিন</p>
              </div>
            </Link>
            <Link href="/tests">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                  <FlaskConical className="h-5 w-5 text-blue-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">টেস্ট বুক করুন</p>
                <p className="text-xs text-gray-400 mt-0.5">ডায়াগনস্টিক সেবা</p>
              </div>
            </Link>
          </div>

          {/* Recent notifications preview */}
          {initialNotifications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">সাম্প্রতিক নোটিফিকেশন</h2>
                <button onClick={() => setTab("notifications")} className="text-[12px] font-semibold text-teal-600 flex items-center gap-0.5">
                  সব দেখুন <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-2">
                {initialNotifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className={cn("bg-white rounded-xl border p-3.5 flex items-start gap-3", notif.isRead ? "border-gray-100" : "border-teal-100")}>
                    <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                      <Bell className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notif.body}</p>
                    </div>
                    {!notif.isRead && <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent prescriptions preview */}
          {initialPrescriptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">সাম্প্রতিক প্রেসক্রিপশন</h2>
                <Link href="/my/prescriptions" className="text-[12px] font-semibold text-teal-600 flex items-center gap-0.5">
                  সব দেখুন <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {initialPrescriptions.slice(0, 2).map((rx) => (
                  <PrescriptionPreviewCard key={rx.id} rx={rx} />
                ))}
              </div>
            </div>
          )}

          {/* Recent past appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2">সাম্প্রতিক ভিজিট</h2>
              <div className="space-y-2">
                {pastAppointments.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      {appt.status === "COMPLETED" ? (
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4.5 w-4.5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{appt.doctor.nameBn}</p>
                      <p className="text-xs text-gray-400">{appt.date} · {appt.chamber.nameBn}</p>
                    </div>
                    {appt.prescription && (
                      <Link href={`/my/prescriptions`} className="text-[11px] font-semibold text-teal-600 shrink-0">
                        ℞ প্রেসক্রিপশন
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAppointments.length === 0 && testBookings.length === 0 && initialPrescriptions.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="h-14 w-14 mx-auto mb-3 text-gray-200" />
              <h3 className="font-semibold text-gray-600 mb-1">কোনো কার্যক্রম নেই</h3>
              <p className="text-sm text-gray-400 mb-5">ডাক্তার খুঁজে সিরিয়াল নিন বা টেস্ট বুক করুন</p>
              <Link href="/doctors">
                <Button>ডাক্তার খুঁজুন</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── APPOINTMENTS ── */}
      {tab === "appointments" && (
        <div className="space-y-5">
          {activeAppointments.length > 0 && (
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2">সক্রিয় সিরিয়াল</h2>
              <div className="space-y-3">
                {activeAppointments.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} live />
                ))}
              </div>
            </div>
          )}

          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-2">পুরানো অ্যাপয়েন্টমেন্ট</h2>
              <div className="space-y-2">
                {pastAppointments.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      {appt.status === "COMPLETED" ? (
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4.5 w-4.5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{appt.doctor.nameBn}</p>
                      <p className="text-xs text-gray-400">{appt.date} · {appt.chamber.nameBn}</p>
                    </div>
                    {appt.prescription ? (
                      <Link href="/my/prescriptions" className="text-[11px] font-semibold text-teal-600 shrink-0 bg-teal-50 px-2.5 py-1.5 rounded-lg">
                        ℞ দেখুন
                      </Link>
                    ) : (
                      <span className={cn("text-[10px] shrink-0 px-2.5 py-1.5 rounded-lg font-semibold", appt.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>
                        {appt.status === "COMPLETED" ? "সম্পন্ন" : "বাতিল"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAppointments.length === 0 && pastAppointments.length === 0 && (
            <div className="text-center py-16">
              <Stethoscope className="h-14 w-14 mx-auto mb-3 text-gray-200" />
              <h3 className="font-semibold text-gray-600 mb-1">কোনো অ্যাপয়েন্টমেন্ট নেই</h3>
              <p className="text-sm text-gray-400 mb-5">ডাক্তার খুঁজে সিরিয়াল নিন</p>
              <Link href="/doctors">
                <Button>ডাক্তার খুঁজুন</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── TEST BOOKINGS ── */}
      {tab === "tests" && (
        <div>
          {testBookings.length === 0 ? (
            <div className="text-center py-16">
              <FlaskConical className="h-14 w-14 mx-auto mb-3 text-gray-200" />
              <h3 className="font-semibold text-gray-600 mb-1">কোনো টেস্ট বুকিং নেই</h3>
              <p className="text-sm text-gray-400 mb-5">ডায়াগনস্টিক টেস্ট বুক করুন</p>
              <Link href="/tests">
                <Button>টেস্ট বুক করুন</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {testBookings.map((booking) => (
                <TestBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRESCRIPTIONS ── */}
      {tab === "prescriptions" && (
        <div>
          {initialPrescriptions.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-14 w-14 mx-auto mb-3 text-gray-200" />
              <h3 className="font-semibold text-gray-600 mb-1">কোনো প্রেসক্রিপশন নেই</h3>
              <p className="text-sm text-gray-400">ডাক্তার দেখালে প্রেসক্রিপশন এখানে দেখাবে</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {initialPrescriptions.map((rx) => (
                  <PrescriptionPreviewCard key={rx.id} rx={rx} />
                ))}
              </div>
              {prescriptionCount > initialPrescriptions.length && (
                <Link href="/my/prescriptions" className="mt-4 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-teal-600 bg-teal-50 py-2.5 rounded-xl">
                  আরও {prescriptionCount - initialPrescriptions.length}টি প্রেসক্রিপশন দেখুন
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === "notifications" && (
        <NotificationsClient notifications={initialNotifications} userId={userId} />
      )}
    </div>
  );
}
