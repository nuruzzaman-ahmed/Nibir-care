import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FileText, Calendar, Stethoscope, Pill, ChevronRight, Clock } from "lucide-react";

export default async function MyPrescriptionsPage() {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") redirect("/login");

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!patient) redirect("/register");

  const prescriptions = await prisma.prescription.findMany({
    where: { patientId: patient.id },
    include: {
      doctor: {
        select: {
          nameBn: true,
          specialties: { where: { isPrimary: true }, include: { specialty: true } },
        },
      },
      appointment: { select: { date: true, serialNumber: true } },
      items: { take: 3, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <FileText className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">আমার প্রেসক্রিপশন</h1>
          <p className="text-sm text-gray-500">{prescriptions.length} টি প্রেসক্রিপশন</p>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো প্রেসক্রিপশন নেই</h3>
          <p className="text-sm text-gray-400">ডাক্তার দেখালে প্রেসক্রিপশন এখানে দেখাবে</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <Link
              key={rx.id}
              href={`/my/prescriptions/${rx.id}`}
              className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-[14px]">{rx.doctor.nameBn}</p>
                    <p className="text-[12px] text-teal-600">{rx.doctor.specialties[0]?.specialty.nameBn ?? ""}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {rx.appointment.date}
                      </span>
                      <span>সিরিয়াল #{rx.appointment.serialNumber}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1" />
              </div>

              {rx.diagnosis && (
                <p className="mt-3 text-[12px] text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                  Dx: {rx.diagnosis}
                </p>
              )}

              {rx.items.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {rx.items.map((item) => (
                    <span key={item.id} className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      <Pill className="h-2.5 w-2.5" />
                      {item.medicineName.split(" ").slice(0, 2).join(" ")}
                    </span>
                  ))}
                  {rx.items.length === 3 && <span className="text-[11px] text-gray-400 py-0.5">আরও আছে...</span>}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
