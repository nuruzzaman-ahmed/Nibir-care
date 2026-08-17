import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  FlaskConical,
  CalendarCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalDoctors,
    totalCenters,
    totalAppointments,
    pendingDoctors,
    pendingCenters,
    recentDoctors,
    recentCenters,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.doctorProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.diagnosticCenter.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.appointment.count(),
    prisma.doctorProfile.findMany({
      where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.diagnosticCenter.findMany({
      where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.doctorProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { specialties: { include: { specialty: true }, where: { isPrimary: true } } },
    }),
    prisma.diagnosticCenter.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const statusColor = (status: string) => {
    if (status === "VERIFIED") return "success";
    if (status === "PENDING") return "warning";
    if (status === "UNDER_REVIEW") return "info";
    return "destructive";
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ওভারভিউ</h1>
          <p className="text-sm text-gray-500">প্ল্যাটফর্মের সার্বিক অবস্থা</p>
        </div>
        <Link href="/" className="text-sm text-teal-600 hover:underline">সাইটে যান →</Link>
      </div>

      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "মোট ব্যবহারকারী", value: totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
            { label: "যাচাইকৃত ডাক্তার", value: totalDoctors, icon: Stethoscope, color: "text-teal-600 bg-teal-50" },
            { label: "ডায়াগনস্টিক সেন্টার", value: totalCenters, icon: FlaskConical, color: "text-purple-600 bg-purple-50" },
            { label: "মোট অ্যাপয়েন্টমেন্ট", value: totalAppointments, icon: CalendarCheck, color: "text-amber-600 bg-amber-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="p-5 flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick management links */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/admin/doctors" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center mb-2">
              <Stethoscope className="h-4.5 w-4.5 text-teal-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">সব ডাক্তার</p>
            <p className="text-xs text-gray-400">পরিচালনা করুন</p>
          </Link>
          <Link href="/admin/centers" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center mb-2">
              <FlaskConical className="h-4.5 w-4.5 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">সব সেন্টার</p>
            <p className="text-xs text-gray-400">পরিচালনা করুন</p>
          </Link>
          <Link href="/admin/users" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              <Users className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">সব ব্যবহারকারী</p>
            <p className="text-xs text-gray-400">পরিচালনা করুন</p>
          </Link>
        </div>

        {/* Pending verifications */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending doctors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  অপেক্ষারত ডাক্তার ({pendingDoctors.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {pendingDoctors.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  কোনো অপেক্ষারত ডাক্তার নেই
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingDoctors.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{doc.nameBn}</p>
                        <p className="text-xs text-gray-400">{doc.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge variant={statusColor(doc.verificationStatus) as "warning" | "info" | "success" | "destructive"}>
                          {doc.verificationStatus === "PENDING" ? "অপেক্ষারত" : "পর্যালোচনা"}
                        </Badge>
                        <div className="flex gap-1">
                          <Link href={`/admin/verify/doctor/${doc.id}?action=verify`}>
                            <Button size="icon-sm" variant="success">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/admin/verify/doctor/${doc.id}?action=reject`}>
                            <Button size="icon-sm" variant="destructive">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending centers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  অপেক্ষারত ডায়াগনস্টিক ({pendingCenters.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {pendingCenters.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  কোনো অপেক্ষারত সেন্টার নেই
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingCenters.map((center) => (
                    <div key={center.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{center.nameBn}</p>
                        <p className="text-xs text-gray-400">{center.district}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge variant="warning">অপেক্ষারত</Badge>
                        <div className="flex gap-1">
                          <Link href={`/admin/verify/center/${center.id}?action=verify`}>
                            <Button size="icon-sm" variant="success">
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/admin/verify/center/${center.id}?action=reject`}>
                            <Button size="icon-sm" variant="destructive">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent registrations */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">সাম্প্রতিক ডাক্তার</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {recentDoctors.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.nameBn}</p>
                      <p className="text-xs text-gray-400">{doc.specialties[0]?.specialty.nameBn ?? ""}</p>
                    </div>
                    <Badge variant={statusColor(doc.verificationStatus) as "warning" | "info" | "success" | "destructive"} className="text-[10px]">
                      {doc.verificationStatus === "VERIFIED" ? "✓ যাচাই" : doc.verificationStatus === "PENDING" ? "অপেক্ষা" : "পর্যালোচনা"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">সাম্প্রতিক ডায়াগনস্টিক</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {recentCenters.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.nameBn}</p>
                      <p className="text-xs text-gray-400">{c.district}</p>
                    </div>
                    <Badge variant={statusColor(c.verificationStatus) as "warning" | "info" | "success" | "destructive"} className="text-[10px]">
                      {c.verificationStatus === "VERIFIED" ? "✓ যাচাই" : "অপেক্ষা"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
