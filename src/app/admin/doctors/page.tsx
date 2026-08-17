import { prisma } from "@/lib/db";
import { AdminDoctorsClient } from "./components/doctors-client";
import { isSubscriptionActive } from "@/lib/subscription";

export default async function AdminDoctorsPage() {
  const doctors = await prisma.doctorProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, phone: true } },
      specialties: { include: { specialty: true }, where: { isPrimary: true } },
      location: { select: { district: true } },
      subscription: { select: { plan: true, status: true, endsAt: true } },
    },
  });

  const rows = doctors.map((d) => ({
    id: d.id,
    nameBn: d.nameBn,
    nameEn: d.nameEn,
    email: d.user.email,
    phone: d.user.phone,
    specialty: d.specialties[0]?.specialty.nameBn ?? null,
    district: d.location?.district ?? null,
    consultationFee: d.consultationFee,
    verificationStatus: d.verificationStatus,
    createdAt: d.createdAt,
    subscriptionActive: isSubscriptionActive(d.subscription),
    plan: d.subscription?.plan ?? null,
  }));

  return <AdminDoctorsClient doctors={rows} />;
}
