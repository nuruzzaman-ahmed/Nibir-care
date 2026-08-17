import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DoctorSidebar } from "./components/doctor-sidebar";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { isSubscriptionActive } from "@/lib/subscription";

export default async function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { subscription: { select: { plan: true, status: true, endsAt: true } } },
  });

  const active = isSubscriptionActive(doctor?.subscription ?? null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorSidebar user={session.user} />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6">
        <SubscriptionGate active={active} expiredPlan={doctor?.subscription?.plan ?? null} billingHref="/doctor/dashboard/billing">
          {children}
        </SubscriptionGate>
      </main>
    </div>
  );
}
