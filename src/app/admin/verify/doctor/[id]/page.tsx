import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VerifyEntityClient } from "../../components/verify-entity-client";

export default async function VerifyDoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const { action } = await searchParams;

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id },
    include: {
      user: true,
      specialties: { include: { specialty: true }, where: { isPrimary: true } },
      location: true,
    },
  });

  if (!doctor) redirect("/admin");

  const logs = await prisma.verificationLog.findMany({
    where: { entityType: "DOCTOR", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const fields = [
    { label: "বাংলায় নাম", value: doctor.nameBn },
    { label: "ইংরেজিতে নাম", value: doctor.nameEn },
    { label: "BMDC নম্বর", value: doctor.bmdc ?? "দেওয়া হয়নি" },
    { label: "বিশেষত্ব", value: doctor.specialties[0]?.specialty.nameBn ?? "দেওয়া হয়নি" },
    { label: "অভিজ্ঞতা", value: doctor.experience ? `${doctor.experience} বছর` : "দেওয়া হয়নি" },
    { label: "ভিজিট ফি", value: `৳${doctor.consultationFee}` },
    { label: "জেলা", value: doctor.location?.district ?? "দেওয়া হয়নি" },
    { label: "ইমেইল", value: doctor.user.email ?? "" },
    { label: "ফোন", value: doctor.user.phone ?? "দেওয়া হয়নি" },
    { label: "যোগদানের তারিখ", value: new Date(doctor.createdAt).toLocaleDateString("bn-BD") },
  ];

  return (
    <VerifyEntityClient
      entityId={id}
      entityType="DOCTOR"
      name={doctor.nameBn}
      currentStatus={doctor.verificationStatus}
      defaultAction={(action as "verify" | "reject") ?? "verify"}
      fields={fields}
      logs={logs}
    />
  );
}
