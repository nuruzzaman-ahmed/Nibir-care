import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const linkSchema = z.object({
  centerId: z.string(),
  doctorId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const center = await prisma.diagnosticCenter.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!center) return NextResponse.json({ error: "Center not found" }, { status: 404 });

  const body = await req.json();
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.centerId !== center.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the doctor exists and is verified
  const doctor = await prisma.doctorProfile.findFirst({
    where: { id: parsed.data.doctorId, verificationStatus: "VERIFIED" },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found or not verified" }, { status: 404 });
  }

  const link = await prisma.centerDoctor.upsert({
    where: {
      centerId_doctorId: {
        centerId: center.id,
        doctorId: parsed.data.doctorId,
      },
    },
    update: { isActive: true },
    create: {
      centerId: center.id,
      doctorId: parsed.data.doctorId,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
