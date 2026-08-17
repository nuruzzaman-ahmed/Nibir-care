import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const itemSchema = z.object({
  medicineName: z.string().min(1),
  medicineId: z.string().optional(),
  dosage: z.string().default("1+0+1"),
  duration: z.string().default("৭ দিন"),
  timing: z.string().default("খাবার পরে"),
  quantity: z.string().optional(),
  instructions: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

const schema = z.object({
  appointmentId: z.string(),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  advice: z.array(z.string()).optional(),
  followUpDays: z.number().int().positive().optional(),
  weight: z.string().optional(),
  bloodPressure: z.string().optional(),
  temperature: z.string().optional(),
  pulse: z.string().optional(),
  items: z.array(itemSchema).min(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!doctor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { appointmentId, items, advice, ...vitals } = parsed.data;

  // Verify this appointment belongs to this doctor
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, doctorId: doctor.id },
    select: { id: true, patientId: true, walkinName: true },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const prescription = await prisma.prescription.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      doctorId: doctor.id,
      patientId: appointment.patientId ?? undefined,
      walkinName: appointment.walkinName ?? undefined,
      advice: advice ? JSON.stringify(advice) : undefined,
      ...vitals,
      items: {
        create: items.map((item, i) => ({ ...item, sortOrder: i })),
      },
    },
    update: {
      advice: advice ? JSON.stringify(advice) : undefined,
      ...vitals,
      items: {
        deleteMany: {},
        create: items.map((item, i) => ({ ...item, sortOrder: i })),
      },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  // Notify patient if they have an account
  if (appointment.patientId) {
    const patientUser = await prisma.patientProfile.findUnique({
      where: { id: appointment.patientId },
      select: { userId: true },
    });
    if (patientUser) {
      await prisma.notification.create({
        data: {
          userId: patientUser.userId,
          type: "GENERAL",
          title: "প্রেসক্রিপশন প্রস্তুত",
          body: "আপনার ডাক্তার প্রেসক্রিপশন লিখেছেন। ড্যাশবোর্ড থেকে দেখুন।",
          data: JSON.stringify({ prescriptionId: prescription.id, appointmentId }),
        },
      });
    }
  }

  return NextResponse.json(prescription, { status: 201 });
}
