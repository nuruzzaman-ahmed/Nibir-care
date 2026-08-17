import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generateSerial } from "@/lib/queue-engine";
import { getTodayDateString } from "@/lib/utils";

const schema = z.object({
  chamberId: z.string(),
  walkinName: z.string().min(1),
  walkinPhone: z.string().optional(),
  patientNote: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { chamberId, walkinName, walkinPhone, patientNote } = parsed.data;
  const date = parsed.data.date ?? getTodayDateString();

  // Verify doctor owns this chamber
  const chamber = await prisma.doctorChamber.findFirst({
    where: { id: chamberId, doctorId: doctor.id, isActive: true },
  });
  if (!chamber) return NextResponse.json({ error: "Chamber not found" }, { status: 404 });

  // Generate serial (atomic, same as online booking)
  const serialNumber = await generateSerial(chamberId, date);

  // Get or create today's queue
  const queue = await prisma.queue.upsert({
    where: { chamberId_date: { chamberId, date } },
    create: {
      chamberId,
      date,
      status: "NOT_STARTED",
      avgConsultDuration: chamber.avgConsultDuration,
      totalBooked: 1,
    },
    update: { totalBooked: { increment: 1 } },
  });

  const appointment = await prisma.appointment.create({
    data: {
      doctorId: doctor.id,
      chamberId,
      queueId: queue.id,
      serialNumber,
      date,
      status: "BOOKED",
      isWalkin: true,
      walkinName,
      walkinPhone: walkinPhone ?? null,
      patientNote: patientNote ?? null,
      // patientId is null — walk-in, no account
    },
  });

  return NextResponse.json({ serialNumber, appointmentId: appointment.id }, { status: 201 });
}
