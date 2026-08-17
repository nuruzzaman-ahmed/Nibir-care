import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DoctorDashboardClient } from "./components/doctor-dashboard-client";
import { getTodayDateString, getTodayDayOfWeek } from "@/lib/utils";

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      specialties: { include: { specialty: true }, where: { isPrimary: true } },
      chambers: {
        where: { isActive: true },
        include: {
          schedules: {
            where: { dayOfWeek: getTodayDayOfWeek(), isActive: true },
          },
        },
      },
    },
  });
  const consultationFee = doctor?.consultationFee ?? 0;

  if (!doctor) {
    return (
      <div className="pt-14 lg:pt-0 text-center py-20 text-gray-500">
        ডাক্তার প্রোফাইল পাওয়া যায়নি। অনুগ্রহ করে প্রোফাইল সম্পন্ন করুন।
      </div>
    );
  }

  const today = getTodayDateString();
  const todayChambers = doctor.chambers.filter((c) => c.schedules.length > 0);

  // Get today's queues
  const todayQueues = await prisma.queue.findMany({
    where: {
      chamberId: { in: doctor.chambers.map((c) => c.id) },
      date: today,
    },
    include: {
      chamber: true,
      appointments: {
        where: { status: { notIn: ["CANCELLED"] } },
        orderBy: { serialNumber: "asc" },
        include: {
          patient: { include: { user: { select: { name: true, phone: true } } } },
        },
      },
    },
  });

  // Stats
  const totalWaiting = todayQueues.reduce(
    (sum, q) => sum + q.appointments.filter((a) => a.status === "WAITING" || a.status === "BOOKED").length,
    0
  );
  const totalCompleted = todayQueues.reduce((sum, q) => sum + q.totalCompleted, 0);
  const totalBooked = todayQueues.reduce((sum, q) => sum + q.totalBooked, 0);

  return (
    <div className="pt-14 lg:pt-0">
      <DoctorDashboardClient
        doctor={{
          id: doctor.id,
          nameBn: doctor.nameBn,
          verificationStatus: doctor.verificationStatus,
          specialties: doctor.specialties,
        }}
        todayChambers={todayChambers}
        todayQueues={todayQueues.map((q) => ({
          ...q,
          startedAt: q.startedAt?.toISOString() ?? null,
          pausedAt: q.pausedAt?.toISOString() ?? null,
          completedAt: q.completedAt?.toISOString() ?? null,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          appointments: q.appointments.map((a) => ({
            ...a,
            startedAt: a.startedAt?.toISOString() ?? null,
            completedAt: a.completedAt?.toISOString() ?? null,
            cancelledAt: a.cancelledAt?.toISOString() ?? null,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          })),
        }))}
        stats={{ totalWaiting, totalCompleted, totalBooked, estimatedEarnings: totalCompleted * consultationFee }}
        today={today}
      />
    </div>
  );
}
