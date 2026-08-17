import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTodayDateString } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "success" | "destructive" | "warning" | "current" }> = {
  BOOKED: { label: "বুকড", variant: "default" },
  WAITING: { label: "অপেক্ষারত", variant: "warning" },
  CURRENT: { label: "চলছে", variant: "current" },
  COMPLETED: { label: "সম্পন্ন", variant: "success" },
  SKIPPED: { label: "বাদ", variant: "warning" },
  NO_SHOW: { label: "অনুপস্থিত", variant: "destructive" },
  CANCELLED: { label: "বাতিল", variant: "destructive" },
};

function patientName(a: { patient: { nameBn: string | null; user: { name: string | null } } | null; walkinName: string | null }) {
  return a.patient?.nameBn ?? a.patient?.user.name ?? a.walkinName ?? "রোগী";
}

export default async function DoctorAppointmentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!doctor) redirect("/register");

  const today = getTodayDateString();

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    orderBy: [{ date: "desc" }, { serialNumber: "asc" }],
    take: 60,
    include: {
      patient: { select: { nameBn: true, nameEn: true, user: { select: { name: true, phone: true } } } },
      chamber: { select: { nameBn: true } },
    },
  });

  const todayAppts = appointments.filter((a) => a.date === today);
  const pastAppts = appointments.filter((a) => a.date !== today);
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const noShowCount = appointments.filter((a) => a.status === "NO_SHOW").length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-1">অ্যাপয়েন্টমেন্ট</h1>
      <p className="text-sm text-gray-500 mb-5">সাম্প্রতিক {appointments.length}টি অ্যাপয়েন্টমেন্ট</p>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-center">
          <p className="text-xl font-bold text-gray-900">{todayAppts.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">আজকের</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-center">
          <p className="text-xl font-bold text-emerald-600">{completedCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">সম্পন্ন</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 text-center">
          <p className="text-xl font-bold text-red-500">{noShowCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">অনুপস্থিত</p>
        </div>
      </div>

      {todayAppts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3">আজকের ({todayAppts.length} জন)</h2>
          <div className="space-y-2">
            {todayAppts.map((a) => {
              const s = STATUS_LABEL[a.status] ?? { label: a.status, variant: "default" as const };
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-sm font-bold text-teal-700">
                    #{a.serialNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                      {patientName(a)}
                      {a.isWalkin && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">ওয়াক-ইন</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{a.chamber.nameBn}</p>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pastAppts.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">পূর্ববর্তী</h2>
          <div className="space-y-2">
            {pastAppts.map((a) => {
              const s = STATUS_LABEL[a.status] ?? { label: a.status, variant: "default" as const };
              return (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                    #{a.serialNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                      {patientName(a)}
                      {a.isWalkin && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">ওয়াক-ইন</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{a.date} · {a.chamber.nameBn}</p>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো অ্যাপয়েন্টমেন্ট নেই</h3>
          <p className="text-sm text-gray-400">রোগীরা সিরিয়াল নিলে এখানে দেখা যাবে</p>
        </div>
      )}
    </div>
  );
}
