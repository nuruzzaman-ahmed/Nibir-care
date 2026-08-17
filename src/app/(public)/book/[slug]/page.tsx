import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { BookingFlow } from "./components/booking-flow";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chamber?: string; date?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await auth();

  if (!session || session.user.role !== "PATIENT") {
    redirect(`/login?callbackUrl=/book/${slug}`);
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug, isActive: true },
    include: {
      chambers: {
        where: { isActive: true },
        include: { schedules: { where: { isActive: true } } },
      },
      specialties: { include: { specialty: true }, where: { isPrimary: true } },
    },
  });

  if (!doctor) notFound();

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!patient) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <BookingFlow
        doctor={doctor}
        patient={patient}
        preselectedChamberId={sp.chamber}
        preselectedDate={sp.date}
      />
    </div>
  );
}
