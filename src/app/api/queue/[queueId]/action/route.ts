import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  nextPatient,
  skipPatient,
  markNoShow,
  pauseQueue,
  resumeQueue,
  setDoctorDelay,
  broadcastQueueUpdate,
  getQueueSummary,
} from "@/lib/queue-engine";
import { z } from "zod";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("next") }),
  z.object({ action: z.literal("skip"), appointmentId: z.string() }),
  z.object({ action: z.literal("noshow"), appointmentId: z.string() }),
  z.object({ action: z.literal("pause") }),
  z.object({ action: z.literal("resume") }),
  z.object({ action: z.literal("delay"), delayMinutes: z.number().min(0).max(120) }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const { queueId } = await params;

  // Verify doctor owns this queue
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { chamber: { include: { doctor: true } } },
  });

  if (!queue) {
    return NextResponse.json({ error: "কিউ পাওয়া যায়নি" }, { status: 404 });
  }

  if (queue.chamber.doctor.userId !== session.user.id) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = actionSchema.parse(body);

    let result: unknown;

    switch (data.action) {
      case "start": {
        // Mark first waiting patient as CURRENT
        const firstAppt = await prisma.appointment.findFirst({
          where: { queueId, status: { in: ["BOOKED", "WAITING"] } },
          orderBy: { serialNumber: "asc" },
        });

        if (firstAppt) {
          await prisma.appointment.update({
            where: { id: firstAppt.id },
            data: { status: "CURRENT", startedAt: new Date() },
          });
        }

        result = await prisma.queue.update({
          where: { id: queueId },
          data: {
            status: "RUNNING",
            startedAt: new Date(),
            currentSerial: firstAppt?.serialNumber ?? 1,
          },
        });
        break;
      }

      case "next":
        result = await nextPatient(queueId, session.user.id);
        break;

      case "skip":
        result = await skipPatient(queueId, data.appointmentId);
        break;

      case "noshow":
        result = await markNoShow(queueId, data.appointmentId);
        break;

      case "pause":
        result = await pauseQueue(queueId);
        break;

      case "resume":
        result = await resumeQueue(queueId);
        break;

      case "delay":
        result = await setDoctorDelay(queueId, data.delayMinutes);
        break;
    }

    // Broadcast update to all SSE clients watching this queue
    const summary = await getQueueSummary(queueId);
    broadcastQueueUpdate(queueId, { type: "QUEUE_UPDATE", queue: summary });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "তথ্য সঠিক নয়" }, { status: 400 });
    }
    console.error("Queue action error:", err);
    return NextResponse.json({ error: "অ্যাকশন ব্যর্থ হয়েছে" }, { status: 500 });
  }
}
