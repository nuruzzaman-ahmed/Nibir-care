import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  centerId: z.string(),
  nameEn: z.string().min(1),
  nameBn: z.string().min(1),
  category: z.string().nullable().optional(),
  price: z.number().int().positive(),
  discountPrice: z.number().int().positive().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  preparation: z.string().nullable().optional(),
  reportTime: z.string().nullable().optional(),
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Ensure the centerId matches the authenticated center
  if (parsed.data.centerId !== center.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = await prisma.diagnosticService.create({
    data: {
      centerId: center.id,
      nameEn: parsed.data.nameEn,
      nameBn: parsed.data.nameBn,
      category: parsed.data.category ?? null,
      price: parsed.data.price,
      discountPrice: parsed.data.discountPrice ?? null,
      duration: parsed.data.duration ?? null,
      preparation: parsed.data.preparation ?? null,
      reportTime: parsed.data.reportTime ?? null,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
