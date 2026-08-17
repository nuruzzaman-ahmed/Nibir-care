import { prisma } from "@/lib/db";
import { HomeClient } from "./home-client";

async function getInitialData() {
  const [specialties, stats] = await Promise.all([
    prisma.specialty.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    Promise.all([
      prisma.doctorProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.diagnosticCenter.count({ where: { verificationStatus: "VERIFIED" } }),
    ]),
  ]);
  return { specialties, stats };
}

export default async function HomePage() {
  const { specialties, stats } = await getInitialData();
  return <HomeClient specialties={specialties} stats={stats} />;
}
