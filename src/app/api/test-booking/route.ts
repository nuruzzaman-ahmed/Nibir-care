import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  centerId: z.string(),
  serviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().optional(),
  patientName: z.string().min(1),
  patientPhone: z.string().min(10),
  patientAge: z.number().int().positive().optional(),
  patientGender: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "রোগীর প্রোফাইল পাওয়া যায়নি" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify service belongs to center
  const service = await prisma.diagnosticService.findFirst({
    where: {
      id: parsed.data.serviceId,
      centerId: parsed.data.centerId,
      isActive: true,
    },
  });
  if (!service) {
    return NextResponse.json({ error: "সেবা পাওয়া যায়নি" }, { status: 404 });
  }

  const totalPrice = service.discountPrice ?? service.price;

  const booking = await prisma.testBooking.create({
    data: {
      patientId: patient.id,
      centerId: parsed.data.centerId,
      serviceId: parsed.data.serviceId,
      date: parsed.data.date,
      timeSlot: parsed.data.timeSlot,
      totalPrice,
      patientName: parsed.data.patientName,
      patientPhone: parsed.data.patientPhone,
      patientAge: parsed.data.patientAge,
      patientGender: parsed.data.patientGender,
      notes: parsed.data.notes,
    },
  });

  // Notify patient
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "TEST_BOOKING_CONFIRMED",
      title: "টেস্ট বুকিং সম্পন্ন",
      body: `${service.nameBn} — ${parsed.data.date} তারিখে বুক করা হয়েছে। নিশ্চিতকরণের জন্য অপেক্ষা করুন।`,
      data: JSON.stringify({ bookingId: booking.id }),
    },
  });

  return NextResponse.json({ bookingId: booking.id, bookingRef: booking.bookingRef }, { status: 201 });
}
