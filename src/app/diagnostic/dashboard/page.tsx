import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  FlaskConical,
  Users,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTodayDateString, formatCurrency } from "@/lib/utils";

export default async function DiagnosticDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") redirect("/login");

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    include: {
      services: { where: { isActive: true } },
      doctors: { where: { isActive: true } },
    },
  });

  if (!center) redirect("/register");

  const today = getTodayDateString();

  // Today's bookings
  const todayBookings = await prisma.testBooking.findMany({
    where: { centerId: center.id, date: today },
    include: {
      service: { select: { nameBn: true, category: true } },
      patient: { select: { nameBn: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Stats
  const totalBookings = await prisma.testBooking.count({
    where: { centerId: center.id },
  });
  const pendingBookings = await prisma.testBooking.count({
    where: { centerId: center.id, status: "PENDING" },
  });
  const confirmedToday = todayBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PROCESSING"
  ).length;
  const completedToday = todayBookings.filter((b) => b.status === "COMPLETED").length;

  // Revenue today (total price of confirmed/completed today)
  const todayRevenue = todayBookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Recent bookings (last 7 days)
  const recentBookings = await prisma.testBooking.findMany({
    where: { centerId: center.id },
    include: {
      service: { select: { nameBn: true, category: true } },
      patient: { select: { nameBn: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const statusLabel: Record<string, { label: string; variant: "default" | "success" | "destructive" | "warning" | "current" }> = {
    PENDING: { label: "অপেক্ষারত", variant: "warning" },
    CONFIRMED: { label: "নিশ্চিত", variant: "default" },
    PROCESSING: { label: "প্রক্রিয়াধীন", variant: "current" },
    COMPLETED: { label: "সম্পন্ন", variant: "success" },
    CANCELLED: { label: "বাতিল", variant: "destructive" },
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{center.nameBn}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {center.verificationStatus === "VERIFIED" ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> যাচাইকৃত কেন্দ্র
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> যাচাই প্রক্রিয়াধীন
                </span>
              )}
            </p>
          </div>
          <Link href="/diagnostic/dashboard/bookings">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              সব বুকিং
            </Button>
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-1">আজ: {today}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <CalendarCheck className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-400">আজ</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{todayBookings.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">মোট বুকিং</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <span className="text-xs text-gray-400">সব</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingBookings}</p>
            <p className="text-xs text-gray-500 mt-0.5">অপেক্ষারত</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <span className="text-xs text-gray-400">আজ</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedToday}</p>
            <p className="text-xs text-gray-500 mt-0.5">সম্পন্ন</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-teal-600" />
              </div>
              <span className="text-xs text-gray-400">আজ</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
            <p className="text-xs text-gray-500 mt-0.5">আয়</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick action grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link href="/diagnostic/dashboard/bookings">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">বুকিং</p>
            <p className="text-xs text-gray-400">পরিচালনা করুন</p>
          </div>
        </Link>
        <Link href="/diagnostic/dashboard/services">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mb-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">সেবাসমূহ</p>
            <p className="text-xs text-gray-400">{center.services.length} টি সক্রিয়</p>
          </div>
        </Link>
        <Link href="/diagnostic/dashboard/doctors">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">ডাক্তার</p>
            <p className="text-xs text-gray-400">{center.doctors.length} জন</p>
          </div>
        </Link>
        <Link href="/diagnostic/dashboard/profile">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">প্রোফাইল</p>
            <p className="text-xs text-gray-400">সম্পাদনা করুন</p>
          </div>
        </Link>
      </div>

      {/* Today's bookings */}
      {todayBookings.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">আজকের বুকিং</h2>
            <Link
              href="/diagnostic/dashboard/bookings"
              className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
            >
              সব দেখুন <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {todayBookings.slice(0, 6).map((booking) => {
              const s = statusLabel[booking.status] ?? { label: booking.status, variant: "default" as const };
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <FlaskConical className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {booking.patientName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {booking.service.nameBn} · {booking.timeSlot ?? "সময় নির্ধারিত নয়"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatCurrency(booking.totalPrice)}
                    </span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">সাম্প্রতিক বুকিং</h2>
          <span className="text-xs text-gray-400">মোট: {totalBookings}</span>
        </div>
        {recentBookings.length > 0 ? (
          <div className="space-y-2">
            {recentBookings.map((booking) => {
              const s = statusLabel[booking.status] ?? { label: booking.status, variant: "default" as const };
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
                >
                  <div className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <FlaskConical className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {booking.patientName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {booking.service.nameBn} · {booking.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatCurrency(booking.totalPrice)}
                    </span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <h3 className="font-semibold text-gray-600 mb-1">কোনো বুকিং নেই</h3>
            <p className="text-sm text-gray-400">প্রথম বুকিং আসলে এখানে দেখা যাবে</p>
          </div>
        )}
      </div>
    </div>
  );
}
