import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DashboardClient } from "./dashboard-client";
import { getTodayDateString } from "@/lib/utils";

export default async function PatientDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role === "DOCTOR") redirect("/doctor/dashboard");
  if (session.user.role === "DIAGNOSTIC") redirect("/diagnostic/dashboard");
  if (session.user.role === "ADMIN") redirect("/admin");

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!patient) redirect("/register");

  const today = getTodayDateString();

  const [
    activeAppointments,
    pastAppointments,
    testBookings,
    notifications,
    prescriptions,
    prescriptionCount,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        status: { in: ["BOOKED", "WAITING", "CURRENT"] },
        date: { gte: today },
      },
      orderBy: [{ date: "asc" }, { serialNumber: "asc" }],
      include: {
        doctor: {
          select: {
            nameBn: true,
            photo: true,
            specialties: { where: { isPrimary: true }, include: { specialty: true } },
          },
        },
        chamber: { select: { nameBn: true, address: true } },
        queue: {
          select: {
            id: true,
            currentSerial: true,
            status: true,
            avgConsultDuration: true,
            doctorDelayMinutes: true,
            note: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
      },
      orderBy: { date: "desc" },
      take: 15,
      include: {
        doctor: {
          select: {
            nameBn: true,
            photo: true,
            specialties: { where: { isPrimary: true }, include: { specialty: true } },
          },
        },
        chamber: { select: { nameBn: true } },
        prescription: { select: { id: true } },
      },
    }),
    prisma.testBooking.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      include: {
        service: { select: { nameBn: true, nameEn: true, category: true, reportTime: true } },
        center: { select: { nameBn: true, slug: true, district: true, thana: true, phone: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.prescription.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        doctor: {
          select: {
            nameBn: true,
            specialties: { where: { isPrimary: true }, include: { specialty: true } },
          },
        },
        appointment: { select: { date: true, serialNumber: true } },
        items: { take: 3, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.prescription.count({ where: { patientId: patient.id } }),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        user={session.user}
        notificationCount={notifications.filter((n) => !n.isRead).length}
      />
      <main className="flex-1 w-full pb-24">
        <DashboardClient
          patientName={patient.nameBn ?? session.user.name ?? "রোগী"}
          initialActiveAppointments={activeAppointments}
          initialPastAppointments={pastAppointments}
          initialTestBookings={testBookings}
          initialNotifications={notifications}
          initialPrescriptions={prescriptions}
          prescriptionCount={prescriptionCount}
          userId={session.user.id}
        />
      </main>
      <BottomNav />
    </div>
  );
}
