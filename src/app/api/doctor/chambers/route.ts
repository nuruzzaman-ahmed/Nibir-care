import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

const chamberSchema = z.object({
  nameBn: z.string().min(2),
  nameEn: z.string().min(2),
  address: z.string().min(3),
  phone: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  googleMapUrl: z.string().optional(),
  dailyLimit: z.number().min(1).max(500),
  avgConsultDuration: z.number().min(1).max(120),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
  schedules: z.array(scheduleSchema).min(1, "কমপক্ষে ১টি সময়সূচী দিন"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!doctor) return NextResponse.json({ error: "প্রোফাইল পাওয়া যায়নি" }, { status: 404 });

  const body = await req.json();
  const parsed = chamberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const chamber = await prisma.doctorChamber.create({
    data: {
      doctorId: doctor.id,
      nameBn: data.nameBn,
      nameEn: data.nameEn,
      address: data.address,
      phone: data.phone || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      googleMapUrl: data.googleMapUrl || null,
      dailyLimit: data.dailyLimit,
      avgConsultDuration: data.avgConsultDuration,
      breakStartTime: data.breakStartTime || null,
      breakEndTime: data.breakEndTime || null,
      schedules: {
        create: data.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      },
    },
    include: { schedules: true },
  });

  return NextResponse.json(chamber);
}
