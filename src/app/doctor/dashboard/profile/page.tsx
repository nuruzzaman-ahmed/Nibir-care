import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Stethoscope, Shield, CheckCircle2, AlertCircle, Star, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function DoctorProfilePage() {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") redirect("/login");

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      specialties: { include: { specialty: true } },
      location: true,
    },
  });
  if (!doctor) redirect("/register");

  const degrees = doctor.degrees ? (JSON.parse(doctor.degrees) as { title: string; institution: string; year?: number }[]) : [];

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-2">আমার প্রোফাইল</h1>
      <p className="text-sm text-gray-500 mb-5">DOC&amp;TEST-এ আপনার প্রোফাইলের তথ্য</p>

      {/* Verification banner */}
      <div className={`mb-5 rounded-2xl p-4 flex items-start gap-3 ${
        doctor.verificationStatus === "VERIFIED"
          ? "bg-emerald-50 border border-emerald-100"
          : "bg-amber-50 border border-amber-100"
      }`}>
        {doctor.verificationStatus === "VERIFIED"
          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          : <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
        <div>
          <p className={`text-sm font-semibold ${doctor.verificationStatus === "VERIFIED" ? "text-emerald-800" : "text-amber-800"}`}>
            {doctor.verificationStatus === "VERIFIED" ? "যাচাইকৃত ডাক্তার" : "যাচাই প্রক্রিয়াধীন"}
          </p>
          <p className={`text-xs mt-0.5 ${doctor.verificationStatus === "VERIFIED" ? "text-emerald-600" : "text-amber-600"}`}>
            {doctor.verificationStatus === "VERIFIED"
              ? "আপনার প্রোফাইল রোগীদের কাছে দৃশ্যমান।"
              : "আমাদের টিম আপনার BMDC তথ্য যাচাই করছে।"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{doctor.totalAppointments}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">মোট রোগী</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-0.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <p className="text-2xl font-bold text-gray-900">{doctor.rating.toFixed(1)}</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">রেটিং</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{doctor.experience}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">বছর অভিজ্ঞতা</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-base">ব্যক্তিগত তথ্য</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">বাংলায় নাম</p>
              <p className="text-sm font-semibold text-gray-900">{doctor.nameBn}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ইংরেজিতে নাম</p>
              <p className="text-sm font-semibold text-gray-900">{doctor.nameEn}</p>
            </div>
          </div>
          {doctor.bmdc && (
            <div>
              <p className="text-xs text-gray-400">BMDC নম্বর</p>
              <p className="text-sm font-semibold text-gray-900">{doctor.bmdc}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">বিশেষত্ব</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {doctor.specialties.map((ds) => (
                <span key={ds.id} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full font-medium">
                  {ds.specialty.nameBn}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">ভিজিট ফি</p>
              <p className="text-sm font-bold text-teal-700">{formatCurrency(doctor.consultationFee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">ফলো-আপ ফি</p>
              <p className="text-sm font-bold text-teal-700">{formatCurrency(doctor.followUpFee)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {degrees.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-3"><CardTitle className="text-base">ডিগ্রি / শিক্ষাগত যোগ্যতা</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {degrees.map((d, i) => (
                <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{d.title}</p>
                  <p className="text-xs text-gray-500">{d.institution}{d.year ? ` · ${d.year}` : ""}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {doctor.about && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">পরিচিতি</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">{doctor.about}</p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-gray-400 text-center mt-5">
        তথ্য পরিবর্তন করতে DOC&amp;TEST সাপোর্টে যোগাযোগ করুন।
      </p>
    </div>
  );
}
