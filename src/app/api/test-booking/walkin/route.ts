import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getTodayDateString } from "@/lib/utils";

const schema = z.object({
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().optional(),
  patientName: z.string().min(1),
  patientPhone: z.string().min(6),
  patientAge: z.number().int().positive().optional(),
  patientGender: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!center) return NextResponse.json({ error: "Center not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const service = await prisma.diagnosticService.findFirst({
    where: { id: parsed.data.serviceId, centerId: center.id, isActive: true },
  });
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const totalPrice = service.discountPrice ?? service.price;

  const booking = await prisma.testBooking.create({
    data: {
      centerId: center.id,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      timeSlot: parsed.data.timeSlot ?? null,
      totalPrice,
      patientName: parsed.data.patientName,
      patientPhone: parsed.data.patientPhone,
      patientAge: parsed.data.patientAge ?? null,
      patientGender: parsed.data.patientGender ?? null,
      notes: parsed.data.notes ?? null,
      isWalkin: true,
      status: "CONFIRMED", // walk-in is auto-confirmed
      // patientId null — no app account
    },
  });

  return NextResponse.json({ bookingId: booking.id, bookingRef: booking.bookingRef }, { status: 201 });
}
