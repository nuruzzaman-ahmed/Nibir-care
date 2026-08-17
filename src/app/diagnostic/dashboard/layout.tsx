import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DiagnosticSidebar } from "./components/diagnostic-sidebar";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { isSubscriptionActive } from "@/lib/subscription";

export default async function DiagnosticDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") {
    redirect("/login");
  }

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { nameBn: true, subscription: { select: { plan: true, status: true, endsAt: true } } },
  });

  const active = isSubscriptionActive(center?.subscription ?? null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DiagnosticSidebar user={session.user} centerName={center?.nameBn ?? undefined} />
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <SubscriptionGate active={active} expiredPlan={center?.subscription?.plan ?? null} billingHref="/diagnostic/dashboard/billing" accent="blue">
          {children}
        </SubscriptionGate>
      </main>
    </div>
  );
}
