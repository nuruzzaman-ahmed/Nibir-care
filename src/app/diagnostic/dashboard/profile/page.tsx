import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DiagnosticProfileClient } from "./components/profile-client";

export default async function DiagnosticProfilePage() {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") redirect("/login");

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
  });

  if (!center) redirect("/register");

  return <DiagnosticProfileClient center={center} />;
}
