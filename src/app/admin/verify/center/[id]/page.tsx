import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VerifyEntityClient } from "../../components/verify-entity-client";

export default async function VerifyCenterPage({
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

  const center = await prisma.diagnosticCenter.findUnique({
    where: { id },
    include: {
      user: true,
      location: true,
      services: { where: { isActive: true }, select: { id: true } },
    },
  });

  if (!center) redirect("/admin");

  const logs = await prisma.verificationLog.findMany({
    where: { entityType: "DIAGNOSTIC", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const fields = [
    { label: "বাংলায় নাম", value: center.nameBn },
    { label: "ইংরেজিতে নাম", value: center.nameEn },
    { label: "ঠিকানা", value: center.address },
    { label: "জেলা", value: center.district },
    { label: "বিভাগ", value: center.division },
    { label: "থানা", value: center.thana ?? "দেওয়া হয়নি" },
    { label: "ফোন", value: center.phone ?? "দেওয়া হয়নি" },
    { label: "ইমেইল", value: center.email ?? center.user.email ?? "" },
    { label: "সেবার সংখ্যা", value: `${center.services.length} টি` },
    { label: "যোগদানের তারিখ", value: new Date(center.createdAt).toLocaleDateString("bn-BD") },
  ];

  return (
    <VerifyEntityClient
      entityId={id}
      entityType="DIAGNOSTIC"
      name={center.nameBn}
      currentStatus={center.verificationStatus}
      defaultAction={(action as "verify" | "reject") ?? "verify"}
      fields={fields}
      logs={logs}
    />
  );
}
