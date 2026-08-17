import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  nameBn: z.string().min(2),
  nameEn: z.string().min(2).optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  thana: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "সঠিক তথ্য দিন" }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const [patient] = await prisma.$transaction([
      prisma.patientProfile.update({
        where: { userId: session.user.id },
        data: {
          nameBn: data.nameBn,
          nameEn: data.nameEn || data.nameBn,
          gender: data.gender || null,
          bloodGroup: data.bloodGroup || null,
          address: data.address || null,
          division: data.division || null,
          district: data.district || null,
          thana: data.thana || null,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { name: data.nameBn, phone: data.phone || null },
      }),
    ]);
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json({ error: "এই ফোন নম্বর ইতিমধ্যে ব্যবহৃত হচ্ছে" }, { status: 400 });
  }
}
