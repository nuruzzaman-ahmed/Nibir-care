import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  nameBn: z.string().min(2),
  nameEn: z.string().min(2),
  about: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(3),
  division: z.string().min(1),
  district: z.string().min(1),
  thana: z.string().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  openDays: z.array(z.string()).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  googleMapUrl: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const center = await prisma.diagnosticCenter.update({
    where: { userId: session.user.id },
    data: {
      nameBn: data.nameBn,
      nameEn: data.nameEn,
      about: data.about || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address,
      division: data.division,
      district: data.district,
      thana: data.thana || null,
      openingTime: data.openingTime || null,
      closingTime: data.closingTime || null,
      openDays: data.openDays ? JSON.stringify(data.openDays) : null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      googleMapUrl: data.googleMapUrl || null,
    },
  });

  return NextResponse.json(center);
}
