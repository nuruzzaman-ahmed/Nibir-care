import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChambersClient } from "./components/chambers-client";

export default async function DoctorChambersPage() {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!doctor) redirect("/register");

  const chambers = await prisma.doctorChamber.findMany({
    where: { doctorId: doctor.id },
    include: { schedules: { orderBy: { dayOfWeek: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return <ChambersClient chambers={chambers} />;
}
