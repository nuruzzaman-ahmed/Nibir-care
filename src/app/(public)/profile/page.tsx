import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProfileClient } from "./components/profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role === "DOCTOR") redirect("/doctor/dashboard/profile");
  if (session.user.role === "DIAGNOSTIC") redirect("/diagnostic/dashboard/profile");
  if (session.user.role === "ADMIN") redirect("/admin");

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { phone: true, email: true } } },
  });
  if (!patient) redirect("/register");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="flex-1 pb-24">
        <ProfileClient patient={patient} />
      </main>
      <BottomNav />
    </div>
  );
}
