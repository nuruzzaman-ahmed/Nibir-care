import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";

// Public endpoint — no auth — used by queue display TV screen
export async function GET(req: NextRequest, { params }: { params: Promise<{ chamberId: string }> }) {
  const { chamberId } = await params;
  const today = getTodayDateString();

  const chamber = await prisma.doctorChamber.findUnique({
    where: { id: chamberId, isActive: true },
    include: {
      doctor: {
        select: { nameBn: true, nameEn: true, specialties: { where: { isPrimary: true }, include: { specialty: true } } },
      },
    },
  });

  if (!chamber) {
    return NextResponse.json({ error: "Chamber not found" }, { status: 404 });
  }

  const queue = await prisma.queue.findUnique({
    where: { chamberId_date: { chamberId, date: today } },
    include: {
      appointments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { serialNumber: "asc" },
        select: {
          id: true,
          serialNumber: true,
          status: true,
          walkinName: true,
          patient: { select: { nameBn: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  const currentAppt = queue?.appointments.find((a) => a.status === "CURRENT");
  const nextAppt = queue?.appointments
    .filter((a) => a.status === "WAITING" || a.status === "BOOKED")
    .sort((a, b) => a.serialNumber - b.serialNumber)[0];

  const getPatientName = (appt: typeof currentAppt) => {
    if (!appt) return null;
    return appt.walkinName ?? appt.patient?.nameBn ?? appt.patient?.user.name ?? "রোগী";
  };

  return NextResponse.json({
    chamber: {
      id: chamber.id,
      nameBn: chamber.nameBn,
      nameEn: chamber.nameEn,
      doctor: {
        nameBn: chamber.doctor.nameBn,
        specialty: chamber.doctor.specialties[0]?.specialty.nameBn ?? "",
      },
    },
    queue: queue
      ? {
          id: queue.id,
          status: queue.status,
          currentSerial: queue.currentSerial,
          totalBooked: queue.totalBooked,
          totalCompleted: queue.totalCompleted,
          avgConsultDuration: queue.avgConsultDuration,
          waiting: queue.appointments.filter(
            (a) => a.status === "WAITING" || a.status === "BOOKED"
          ).length,
        }
      : null,
    current: currentAppt
      ? { serial: currentAppt.serialNumber, name: getPatientName(currentAppt) }
      : null,
    next: nextAppt
      ? { serial: nextAppt.serialNumber, name: getPatientName(nextAppt) }
      : null,
    date: today,
  });
}
