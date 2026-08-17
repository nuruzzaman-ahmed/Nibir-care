/**
 * DOC&TEST Queue Engine
 * Handles smart ETA calculation, next-patient logic, skip/no-show,
 * and SSE notification broadcasting.
 */

import { prisma } from "./db";

// ─── SSE broadcast store (in-process for single-server MVP) ──────────────────
// In production, replace with Redis pub/sub or Supabase Realtime
type SSEClient = {
  queueId: string;
  controller: ReadableStreamDefaultController;
};

const sseClients: Set<SSEClient> = new Set();

export function registerSSEClient(
  queueId: string,
  controller: ReadableStreamDefaultController
): () => void {
  const client: SSEClient = { queueId, controller };
  sseClients.add(client);
  return () => sseClients.delete(client);
}

export function broadcastQueueUpdate(queueId: string, data: unknown) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    if (client.queueId === queueId) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch {
        sseClients.delete(client);
      }
    }
  }
}

// ─── ETA Calculation ─────────────────────────────────────────────────────────

export function calculateETA(
  patientSerial: number,
  currentSerial: number,
  avgDuration: number,
  doctorDelayMinutes: number
): number {
  const patientsAhead = Math.max(0, patientSerial - currentSerial - 1);
  const etaMinutes = patientsAhead * avgDuration + doctorDelayMinutes;
  return etaMinutes;
}

export function updateRollingAverage(
  currentAvg: number,
  newDuration: number,
  sampleSize = 10
): number {
  // Exponential moving average weighted toward recent consultations
  const weight = 1 / Math.min(sampleSize, 10);
  return Math.round((currentAvg * (1 - weight) + newDuration * weight) * 10) / 10;
}

// ─── Queue State Machine ──────────────────────────────────────────────────────

export async function getOrCreateQueue(chamberId: string, date: string) {
  const existing = await prisma.queue.findUnique({
    where: { chamberId_date: { chamberId, date } },
    include: {
      chamber: { include: { doctor: true } },
      appointments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { serialNumber: "asc" },
      },
    },
  });
  if (existing) return existing;

  const chamber = await prisma.doctorChamber.findUnique({
    where: { id: chamberId },
  });

  return prisma.queue.create({
    data: {
      chamberId,
      date,
      avgConsultDuration: chamber?.avgConsultDuration ?? 10,
    },
    include: {
      chamber: { include: { doctor: true } },
      appointments: { orderBy: { serialNumber: "asc" } },
    },
  });
}

export async function generateSerial(chamberId: string, date: string): Promise<number> {
  // Atomic serial generation using a transaction
  return await prisma.$transaction(async (tx) => {
    const queue = await tx.queue.upsert({
      where: { chamberId_date: { chamberId, date } },
      update: { totalBooked: { increment: 1 } },
      create: { chamberId, date, totalBooked: 1 },
    });

    const chamber = await tx.doctorChamber.findUnique({
      where: { id: chamberId },
    });

    if (chamber && queue.totalBooked > chamber.dailyLimit) {
      throw new Error("DAILY_LIMIT_REACHED");
    }

    return queue.totalBooked;
  });
}

export async function nextPatient(queueId: string, doctorUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const queue = await tx.queue.findUnique({
      where: { id: queueId },
      include: {
        appointments: {
          where: { status: { in: ["CURRENT", "WAITING", "BOOKED"] } },
          orderBy: { serialNumber: "asc" },
        },
        chamber: true,
      },
    });

    if (!queue) throw new Error("Queue not found");

    const now = new Date();

    // Complete current patient
    const current = queue.appointments.find((a) => a.status === "CURRENT");
    let newAvg = queue.avgConsultDuration;

    if (current) {
      const consultDuration = current.startedAt
        ? Math.round((now.getTime() - current.startedAt.getTime()) / 60000)
        : queue.chamber.avgConsultDuration;

      await tx.appointment.update({
        where: { id: current.id },
        data: {
          status: "COMPLETED",
          completedAt: now,
          consultDuration,
        },
      });

      // Update rolling average
      newAvg = updateRollingAverage(queue.avgConsultDuration, consultDuration);

      await tx.queue.update({
        where: { id: queueId },
        data: {
          totalCompleted: { increment: 1 },
          avgConsultDuration: newAvg,
        },
      });
    }

    // Find next WAITING patient
    const nextWaiting = queue.appointments
      .filter((a) => a.status === "WAITING" || a.status === "BOOKED")
      .sort((a, b) => a.serialNumber - b.serialNumber)[0];

    if (!nextWaiting) {
      // Queue complete
      const updatedQueue = await tx.queue.update({
        where: { id: queueId },
        data: { status: "COMPLETED", completedAt: now },
      });
      return { queue: updatedQueue, currentAppointment: null };
    }

    // Advance to next
    await tx.appointment.update({
      where: { id: nextWaiting.id },
      data: { status: "CURRENT", startedAt: now },
    });

    const updatedQueue = await tx.queue.update({
      where: { id: queueId },
      data: {
        currentSerial: nextWaiting.serialNumber,
        status: "RUNNING",
        avgConsultDuration: newAvg,
      },
    });

    // Create notification for the patient whose turn it is
    await createQueueNotification(tx, nextWaiting.id, "QUEUE_CURRENT");

    // Notify patients who are close (2 and 5 away)
    const remaining = queue.appointments.filter(
      (a) =>
        (a.status === "WAITING" || a.status === "BOOKED") &&
        a.id !== nextWaiting.id
    );

    for (const appt of remaining) {
      const ahead = appt.serialNumber - nextWaiting.serialNumber;
      if (ahead === 2) {
        await createQueueNotification(tx, appt.id, "QUEUE_VERY_NEAR");
      } else if (ahead === 5) {
        await createQueueNotification(tx, appt.id, "QUEUE_NEAR");
      } else if (ahead === 10) {
        await createQueueNotification(tx, appt.id, "QUEUE_APPROACHING");
      }
    }

    return { queue: updatedQueue, currentAppointment: nextWaiting };
  });
}

export async function skipPatient(queueId: string, appointmentId: string) {
  return await prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "SKIPPED" },
    });

    const updatedQueue = await tx.queue.update({
      where: { id: queueId },
      data: { totalSkipped: { increment: 1 } },
    });

    return { queue: updatedQueue, appointment: appt };
  });
}

export async function markNoShow(queueId: string, appointmentId: string) {
  return await prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "NO_SHOW", completedAt: new Date() },
    });

    const updatedQueue = await tx.queue.update({
      where: { id: queueId },
      data: { totalNoShow: { increment: 1 } },
    });

    return { queue: updatedQueue, appointment: appt };
  });
}

export async function pauseQueue(queueId: string) {
  return prisma.queue.update({
    where: { id: queueId },
    data: { status: "PAUSED", pausedAt: new Date() },
  });
}

export async function resumeQueue(queueId: string) {
  return prisma.queue.update({
    where: { id: queueId },
    data: { status: "RUNNING", pausedAt: null },
  });
}

export async function setDoctorDelay(queueId: string, delayMinutes: number) {
  const queue = await prisma.queue.update({
    where: { id: queueId },
    data: { doctorDelayMinutes: delayMinutes },
    include: { appointments: { where: { status: "WAITING" }, include: { patient: { include: { user: true } } } } },
  });

  // Notify all waiting patients about delay (walk-ins have no account — skip)
  for (const appt of queue.appointments) {
    if (!appt.patient) continue;
    await prisma.notification.create({
      data: {
        userId: appt.patient.userId,
        type: "DOCTOR_DELAY",
        title: "ডাক্তার দেরিতে আসবেন",
        body: `ডাক্তার ${delayMinutes} মিনিট দেরিতে চেম্বার শুরু করবেন। অনুগ্রহ করে সময়মতো আসুন।`,
        data: JSON.stringify({ queueId, delayMinutes }),
      },
    });
  }

  return queue;
}

// ─── Internal notification helper ────────────────────────────────────────────

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function createQueueNotification(
  tx: PrismaTx,
  appointmentId: string,
  type: string
) {
  const appt = await tx.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { include: { user: true } },
      doctor: true,
    },
  });

  // Walk-in patients have no account — skip notification
  if (!appt || !appt.patient) return;

  const messages: Record<string, { title: string; body: string }> = {
    QUEUE_CURRENT: {
      title: "আপনার সিরিয়াল এসেছে!",
      body: `আপনার সিরিয়াল #${appt.serialNumber} এখন চলছে। অনুগ্রহ করে চেম্বারে আসুন।`,
    },
    QUEUE_VERY_NEAR: {
      title: "প্রস্তুত থাকুন",
      body: `আপনার সিরিয়াল #${appt.serialNumber} আর মাত্র ২ জন পরেই আসছে।`,
    },
    QUEUE_NEAR: {
      title: "সিরিয়াল শীঘ্রই আসছে",
      body: `আপনার সিরিয়াল #${appt.serialNumber} আর ৫ জন পরেই আসছে।`,
    },
    QUEUE_APPROACHING: {
      title: "সিরিয়াল আসতে প্রায় ৬০ মিনিট",
      body: `আপনার সিরিয়াল #${appt.serialNumber} আনুমানিক ৬০ মিনিটের মধ্যে আসবে।`,
    },
  };

  const msg = messages[type];
  if (!msg) return;

  await tx.notification.create({
    data: {
      userId: appt.patient.userId,
      type,
      title: msg.title,
      body: msg.body,
      data: JSON.stringify({ appointmentId, serialNumber: appt.serialNumber }),
    },
  });
}

// ─── Queue Summary ────────────────────────────────────────────────────────────

export async function getQueueSummary(queueId: string) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      chamber: { include: { doctor: true } },
      appointments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { serialNumber: "asc" },
        include: {
          patient: { include: { user: true } },
        },
      },
    },
  });
  return queue;
}
