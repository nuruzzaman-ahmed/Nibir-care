import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DoctorsClient } from "./components/doctors-client";

export default async function DiagnosticDoctorsPage() {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") redirect("/login");

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!center) redirect("/register");

  const linkedDoctors = await prisma.centerDoctor.findMany({
    where: { centerId: center.id },
    include: {
      doctor: {
        include: {
          specialties: {
            include: { specialty: true },
            where: { isPrimary: true },
          },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  // Get all VERIFIED doctors for search
  const allDoctors = await prisma.doctorProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      isActive: true,
      // Exclude already linked
      id: { notIn: linkedDoctors.map((l) => l.doctorId) },
    },
    include: {
      specialties: {
        include: { specialty: true },
        where: { isPrimary: true },
      },
    },
    orderBy: { nameBn: "asc" },
    take: 50,
  });

  return (
    <DoctorsClient
      linkedDoctors={linkedDoctors}
      availableDoctors={allDoctors}
      centerId={center.id}
    />
  );
}
