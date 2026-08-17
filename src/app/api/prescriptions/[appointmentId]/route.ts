import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId } = await params;

  const prescription = await prisma.prescription.findUnique({
    where: { appointmentId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      doctor: { select: { nameBn: true, nameEn: true, degrees: true, bmdc: true, specialties: { where: { isPrimary: true }, include: { specialty: true } } } },
    },
  });

  if (!prescription) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auth check: doctor who wrote it, or the patient
  const isDoctorOwner =
    session.user.role === "DOCTOR" &&
    (await prisma.doctorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } }))?.id === prescription.doctorId;

  const isPatientOwner =
    session.user.role === "PATIENT" &&
    prescription.patientId != null &&
    (await prisma.patientProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } }))?.id === prescription.patientId;

  if (!isDoctorOwner && !isPatientOwner && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(prescription);
}
