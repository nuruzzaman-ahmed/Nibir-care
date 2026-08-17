import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED"],
};

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"]),
  cancelReason: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!center) return NextResponse.json({ error: "Center not found" }, { status: 404 });

  const { id } = await params;

  const booking = await prisma.testBooking.findFirst({
    where: { id, centerId: center.id },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const allowed = VALID_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${booking.status} to ${parsed.data.status}` },
      { status: 422 }
    );
  }

  const updated = await prisma.testBooking.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.cancelReason ? { cancelReason: parsed.data.cancelReason } : {}),
    },
  });

  // Notify patient
  const notifMap: Record<string, { title: string; body: string }> = {
    CONFIRMED: {
      title: "টেস্ট বুকিং নিশ্চিত",
      body: `আপনার ${booking.date} তারিখের টেস্ট বুকিং নিশ্চিত করা হয়েছে।`,
    },
    COMPLETED: {
      title: "টেস্ট সম্পন্ন",
      body: `আপনার টেস্ট সম্পন্ন হয়েছে। রিপোর্ট সংগ্রহ করুন।`,
    },
    CANCELLED: {
      title: "টেস্ট বুকিং বাতিল",
      body: `আপনার ${booking.date} তারিখের টেস্ট বুকিং বাতিল করা হয়েছে।`,
    },
  };

  const notifData = notifMap[parsed.data.status];
  if (notifData && booking.patientId) {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: booking.patientId },
      select: { userId: true },
    });
    if (patient) {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          type: parsed.data.status === "CANCELLED" ? "GENERAL" : "TEST_BOOKING_CONFIRMED",
          title: notifData.title,
          body: notifData.body,
          data: JSON.stringify({ bookingId: booking.id }),
        },
      });
    }
  }

  return NextResponse.json(updated);
}
