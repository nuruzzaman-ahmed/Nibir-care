import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookingsClient } from "./components/bookings-client";

export default async function BookingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") redirect("/login");

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!center) redirect("/register");

  const [bookings, services] = await Promise.all([
    prisma.testBooking.findMany({
      where: { centerId: center.id },
      include: {
        service: { select: { nameBn: true, category: true } },
        patient: { select: { nameBn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.diagnosticService.findMany({
      where: { centerId: center.id, isActive: true },
      select: { id: true, nameBn: true, price: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return <BookingsClient bookings={bookings} centerId={center.id} services={services} />;
}
