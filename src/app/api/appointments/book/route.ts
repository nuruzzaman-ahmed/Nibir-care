import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSerial, getOrCreateQueue } from "@/lib/queue-engine";
import { z } from "zod";

const schema = z.object({
  chamberId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotTime: z.string().optional(),
  patientNote: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Get patient profile
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!patient) {
      return NextResponse.json({ error: "রোগীর প্রোফাইল পাওয়া যায়নি" }, { status: 404 });
    }

    // Get chamber
    const chamber = await prisma.doctorChamber.findUnique({
      where: { id: data.chamberId, isActive: true },
      include: { doctor: true },
    });
    if (!chamber) {
      return NextResponse.json({ error: "চেম্বার পাওয়া যায়নি" }, { status: 404 });
    }

    // Check if patient already has an appointment on this date at this chamber
    const existing = await prisma.queue.findUnique({
      where: { chamberId_date: { chamberId: data.chamberId, date: data.date } },
    });

    if (existing) {
      const duplicate = await prisma.appointment.findFirst({
        where: {
          queueId: existing.id,
          patientId: patient.id,
          status: { in: ["BOOKED", "WAITING", "CURRENT"] },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "এই দিনে এই চেম্বারে আপনার ইতিমধ্যেই সিরিয়াল আছে" },
          { status: 400 }
        );
      }
    }

    // Generate serial atomically
    let serialNumber: number;
    try {
      serialNumber = await generateSerial(data.chamberId, data.date);
    } catch (err) {
      if ((err as Error).message === "DAILY_LIMIT_REACHED") {
        return NextResponse.json(
          { error: "দৈনিক সিরিয়ালের সীমা পূর্ণ হয়ে গেছে" },
          { status: 400 }
        );
      }
      throw err;
    }

    // Get queue (it was just upserted)
    const queue = await prisma.queue.findUnique({
      where: { chamberId_date: { chamberId: data.chamberId, date: data.date } },
    });

    if (!queue) throw new Error("Queue not found after creation");

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: chamber.doctorId,
        chamberId: data.chamberId,
        queueId: queue.id,
        serialNumber,
        slotTime: data.slotTime ?? null,
        date: data.date,
        status: queue.status === "RUNNING" ? "WAITING" : "BOOKED",
        patientNote: data.patientNote ?? null,
      },
    });

    // Send booking confirmation notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "BOOKING_CONFIRMED",
        title: "সিরিয়াল নিশ্চিত হয়েছে!",
        body: `আপনার সিরিয়াল #${serialNumber} নিশ্চিত হয়েছে। তারিখ: ${data.date}`,
        data: JSON.stringify({ appointmentId: appointment.id, serialNumber }),
      },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        serialNumber,
        queueId: queue.id,
        date: data.date,
        status: appointment.status,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "তথ্য সঠিক নয়" }, { status: 400 });
    }
    console.error("Book appointment error:", err);
    return NextResponse.json({ error: "সিরিয়াল নেওয়া যায়নি" }, { status: 500 });
  }
}
