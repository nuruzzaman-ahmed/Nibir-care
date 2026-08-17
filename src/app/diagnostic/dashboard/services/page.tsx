import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ServicesClient } from "./components/services-client";

export default async function ServicesPage() {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") redirect("/login");

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!center) redirect("/register");

  const services = await prisma.diagnosticService.findMany({
    where: { centerId: center.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <ServicesClient services={services} centerId={center.id} />;
}
