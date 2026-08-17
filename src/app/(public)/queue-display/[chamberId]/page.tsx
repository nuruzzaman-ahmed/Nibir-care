import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getTodayDateString } from "@/lib/utils";
import { TVDisplay } from "./components/tv-display";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Queue Display — DOC&TEST" };

export default async function QueueDisplayPage({
  params,
}: {
  params: Promise<{ chamberId: string }>;
}) {
  const { chamberId } = await params;
  const today = getTodayDateString();

  const chamber = await prisma.doctorChamber.findUnique({
    where: { id: chamberId, isActive: true },
    include: {
      doctor: {
        select: {
          nameBn: true,
          nameEn: true,
          specialties: { where: { isPrimary: true }, include: { specialty: true } },
        },
      },
    },
  });

  if (!chamber) notFound();

  const queue = await prisma.queue.findUnique({
    where: { chamberId_date: { chamberId, date: today } },
    include: {
      appointments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { serialNumber: "asc" },
        select: {
          serialNumber: true,
          status: true,
          walkinName: true,
          patient: { select: { nameBn: true, user: { select: { name: true } } } },
        },
      },
    },
  });

  const currentAppt = queue?.appointments.find((a) => a.status === "CURRENT");
  const nextAppt = queue?.appointments
    .filter((a) => a.status === "WAITING" || a.status === "BOOKED")
    .sort((a, b) => a.serialNumber - b.serialNumber)[0];

  const getName = (appt: typeof currentAppt) =>
    appt?.walkinName ?? appt?.patient?.nameBn ?? appt?.patient?.user.name ?? null;

  return (
    <TVDisplay
      chamberId={chamberId}
      queueId={queue?.id ?? null}
      chamberName={chamber.nameBn}
      doctorName={chamber.doctor.nameBn}
      specialty={chamber.doctor.specialties[0]?.specialty.nameBn ?? ""}
      initialCurrent={currentAppt ? { serial: currentAppt.serialNumber, name: getName(currentAppt) } : null}
      initialNext={nextAppt ? { serial: nextAppt.serialNumber, name: getName(nextAppt) } : null}
      initialStatus={queue?.status ?? "NOT_STARTED"}
      totalBooked={queue?.totalBooked ?? 0}
      totalCompleted={queue?.totalCompleted ?? 0}
      waiting={
        (queue?.appointments.filter((a) => a.status === "WAITING" || a.status === "BOOKED").length) ?? 0
      }
      avgDuration={queue?.avgConsultDuration ?? 10}
    />
  );
}
