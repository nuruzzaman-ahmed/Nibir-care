import { prisma } from "@/lib/db";
import { DoctorsClient } from "./components/doctors-client";

async function getSpecialties() {
  return prisma.specialty.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export default async function DoctorsPage() {
  const specialties = await getSpecialties();
  return <DoctorsClient specialties={specialties} />;
}
