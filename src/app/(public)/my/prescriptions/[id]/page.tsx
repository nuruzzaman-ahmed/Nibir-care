import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Printer, Stethoscope, Pill, Calendar, User } from "lucide-react";

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") redirect("/login");

  const { id } = await params;

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, nameBn: true, dateOfBirth: true, gender: true },
  });
  if (!patient) redirect("/register");

  const rx = await prisma.prescription.findUnique({
    where: { id, patientId: patient.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      doctor: {
        select: {
          nameBn: true,
          nameEn: true,
          degrees: true,
          bmdc: true,
          specialties: { where: { isPrimary: true }, include: { specialty: true } },
          chambers: { where: { isActive: true }, select: { nameBn: true, address: true, phone: true }, take: 1 },
        },
      },
      appointment: { select: { date: true, serialNumber: true } },
    },
  });

  if (!rx) notFound();

  let degrees: { title: string }[] = [];
  try { degrees = rx.doctor.degrees ? JSON.parse(rx.doctor.degrees) : []; } catch { degrees = []; }

  let adviceList: string[] = [];
  try { adviceList = rx.advice ? JSON.parse(rx.advice) : []; } catch { adviceList = []; }

  const chamber = rx.doctor.chambers[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top actions */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/my/prescriptions" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          ফিরে যান
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-[13px] font-medium text-teal-600 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
        >
          <Printer className="h-4 w-4" />
          প্রিন্ট করুন
        </button>
      </div>

      {/* Prescription card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-gray-300">
        {/* Header */}
        <div className="bg-teal-600 text-white px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{rx.doctor.nameBn}</h1>
              {degrees.length > 0 && (
                <p className="text-teal-100 text-sm mt-0.5">{degrees.map((d) => d.title).join(", ")}</p>
              )}
              <p className="text-teal-200 text-sm mt-0.5">{rx.doctor.specialties[0]?.specialty.nameBn ?? ""}</p>
              {rx.doctor.bmdc && <p className="text-teal-200 text-xs mt-0.5">BMDC: {rx.doctor.bmdc}</p>}
            </div>
            <div className="text-right text-sm text-teal-100">
              {chamber && (
                <>
                  <p className="font-medium">{chamber.nameBn}</p>
                  <p className="text-xs mt-0.5">{chamber.address}</p>
                  {chamber.phone && <p className="text-xs">{chamber.phone}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Patient & date info */}
          <div className="flex flex-wrap gap-4 text-[13px] border-b border-gray-100 pb-4">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-semibold text-gray-700">{patient.nameBn ?? "রোগী"}</span>
            </div>
            {patient.gender && (
              <span className="text-gray-500">লিঙ্গ: {patient.gender === "MALE" ? "পুরুষ" : patient.gender === "FEMALE" ? "মহিলা" : "অন্য"}</span>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-600">{rx.appointment.date}</span>
            </div>
            <span className="text-gray-500">সিরিয়াল: #{rx.appointment.serialNumber}</span>
          </div>

          {/* Vitals */}
          {(rx.weight || rx.bloodPressure || rx.temperature || rx.pulse) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "ওজন", val: rx.weight },
                { label: "রক্তচাপ", val: rx.bloodPressure },
                { label: "তাপমাত্রা", val: rx.temperature },
                { label: "পালস", val: rx.pulse },
              ].filter((v) => v.val).map((v) => (
                <div key={v.label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-[11px] text-gray-400">{v.label}</p>
                  <p className="text-[14px] font-bold text-gray-900 mt-0.5">{v.val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Chief complaint + Diagnosis */}
          {(rx.chiefComplaint || rx.diagnosis) && (
            <div className="space-y-2">
              {rx.chiefComplaint && (
                <div className="text-[13px]">
                  <span className="font-semibold text-gray-600">CC: </span>
                  <span className="text-gray-800">{rx.chiefComplaint}</span>
                </div>
              )}
              {rx.diagnosis && (
                <div className="text-[13px]">
                  <span className="font-semibold text-gray-600">Dx: </span>
                  <span className="text-gray-800 font-medium">{rx.diagnosis}</span>
                </div>
              )}
            </div>
          )}

          {/* Medicines */}
          {rx.items.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-serif font-bold text-teal-700">℞</span>
                <h3 className="font-bold text-gray-800">ওষুধের তালিকা</h3>
              </div>
              <div className="space-y-2">
                {rx.items.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-[14px] flex items-center gap-2">
                        <Pill className="h-3.5 w-3.5 text-teal-500" />
                        {item.medicineName}
                      </p>
                      <p className="text-[12px] text-gray-600 mt-0.5">
                        {item.dosage} · {item.timing} · {item.duration}
                        {item.quantity ? ` · মোট: ${item.quantity}` : ""}
                      </p>
                      {item.instructions && (
                        <p className="text-[11px] text-amber-700 mt-0.5">{item.instructions}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advice */}
          {adviceList.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-2">পরামর্শ</h3>
              <ul className="space-y-1">
                {adviceList.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span className="text-teal-600 font-bold mt-0.5">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow up */}
          {rx.followUpDays && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-[13px] font-semibold text-amber-800">
                🗓 {rx.followUpDays} দিনের মধ্যে পুনরায় আসুন
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between text-[11px] text-gray-400">
          <span>DOC&amp;TEST — ডিজিটাল স্বাস্থ্যসেবা বাংলাদেশ</span>
          <span>এটি কম্পিউটার জেনারেটেড প্রেসক্রিপশন</span>
        </div>
      </div>
    </div>
  );
}
