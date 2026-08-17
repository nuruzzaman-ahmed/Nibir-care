import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Bell, ArrowLeft, CheckCheck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { NotificationsClient } from "./components/notifications-client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={session.user} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard" className="h-9 w-9 rounded-xl flex items-center justify-center bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">নোটিফিকেশন</h1>
        </div>
        <NotificationsClient notifications={notifications} userId={session.user.id} />
      </main>
      <BottomNav />
    </div>
  );
}
