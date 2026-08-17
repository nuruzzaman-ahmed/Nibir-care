import { prisma } from "@/lib/db";
import { AdminCentersClient } from "./components/centers-client";
import { isSubscriptionActive } from "@/lib/subscription";

export default async function AdminCentersPage() {
  const centers = await prisma.diagnosticCenter.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, phone: true } },
      services: { select: { id: true } },
      subscription: { select: { plan: true, status: true, endsAt: true } },
    },
  });

  const rows = centers.map((c) => ({
    id: c.id,
    nameBn: c.nameBn,
    nameEn: c.nameEn,
    email: c.user.email,
    phone: c.phone,
    district: c.district,
    serviceCount: c.services.length,
    verificationStatus: c.verificationStatus,
    createdAt: c.createdAt,
    subscriptionActive: isSubscriptionActive(c.subscription),
    plan: c.subscription?.plan ?? null,
  }));

  return <AdminCentersClient centers={rows} />;
}
