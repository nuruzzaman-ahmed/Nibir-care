import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BillingClient } from "@/components/billing/billing-client";
import { isSubscriptionActive, subscriptionDaysLeft } from "@/lib/subscription";

export default async function DiagnosticBillingPage() {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") redirect("/login");

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { subscription: true },
  });

  const sub = center?.subscription ?? null;
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
