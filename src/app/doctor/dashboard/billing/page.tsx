import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BillingClient } from "@/components/billing/billing-client";
import { isSubscriptionActive, subscriptionDaysLeft } from "@/lib/subscription";

export default async function DoctorBillingPage() {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { subscription: true },
  });

  const sub = doctor?.subscription ?? null;
  const current = sub
    ? {
        plan: sub.plan,
        status: sub.status,
        endsAt: sub.endsAt.toISOString(),
        isActive: isSubscriptionActive(sub),
        daysLeft: subscriptionDaysLeft(sub),
      }
    : null;

  return <BillingClient current={current} />;
}
