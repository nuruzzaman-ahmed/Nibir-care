import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
  }

  const today = getTodayDateString();

  const [active, past] = await Promise.all([
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
  ]);

  return NextResponse.json({ active, past });
}
