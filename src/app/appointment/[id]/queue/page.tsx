import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { LiveQueueView } from "./components/live-queue-view";
import { calculateETA } from "@/lib/queue-engine";

type Props = { params: Promise<{ id: string }> };

export default async function AppointmentQueuePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session) redirect(`/login?callbackUrl=/appointment/${id}/queue`);

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: {
        include: {
          specialties: { include: { specialty: true }, where: { isPrimary: true } },
        },
      },
      chamber: true,
      queue: true,
      patient: { include: { user: true } },
    },
  });

  if (!appointment) notFound();

  // Verify ownership (patient or doctor)
  const patient = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });

  const isOwner =
    (patient && appointment.patientId === patient.id) ||
    (doctor && appointment.doctorId === doctor.id) ||
    session.user.role === "ADMIN";

  if (!isOwner) redirect("/dashboard");

  const eta = calculateETA(
    appointment.serialNumber,
    appointment.queue.currentSerial,
    appointment.queue.avgConsultDuration,
    appointment.queue.doctorDelayMinutes
  );

  const patientsAhead = Math.max(
    0,
    appointment.serialNumber - appointment.queue.currentSerial - 1
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <LiveQueueView
        appointment={{
          id: appointment.id,
          serialNumber: appointment.serialNumber,
          status: appointment.status,
          date: appointment.date,
          slotTime: appointment.slotTime ?? null,
        }}
        queue={{
          id: appointment.queue.id,
          currentSerial: appointment.queue.currentSerial,
          status: appointment.queue.status,
          avgConsultDuration: appointment.queue.avgConsultDuration,
          doctorDelayMinutes: appointment.queue.doctorDelayMinutes,
          note: appointment.queue.note ?? null,
          updatedAt: appointment.queue.updatedAt.toISOString(),
        }}
        doctor={{
          nameBn: appointment.doctor.nameBn,
          specialty: appointment.doctor.specialties[0]?.specialty.nameBn ?? "",
        }}
        chamber={{
          nameBn: appointment.chamber.nameBn,
          address: appointment.chamber.address,
        }}
        initialETA={eta}
        initialPatientsAhead={patientsAhead}
      />
    </div>
  );
}
