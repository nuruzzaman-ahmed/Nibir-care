import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const bookings = await prisma.testBooking.findMany({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    include: {
      service: { select: { nameBn: true, nameEn: true, category: true, reportTime: true } },
      center: { select: { nameBn: true, slug: true, district: true, thana: true, phone: true } },
    },
  });

  return NextResponse.json(bookings);
}
