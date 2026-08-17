import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameBn: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  price: z.number().int().positive().optional(),
  discountPrice: z.number().int().positive().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  preparation: z.string().nullable().optional(),
  reportTime: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

async function getCenter(userId: string) {
  return prisma.diagnosticCenter.findUnique({
    where: { userId },
    select: { id: true },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const center = await getCenter(session.user.id);
  if (!center) return NextResponse.json({ error: "Center not found" }, { status: 404 });

  const { id } = await params;

  // Verify ownership
  const service = await prisma.diagnosticService.findFirst({
    where: { id, centerId: center.id },
  });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.diagnosticService.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "DIAGNOSTIC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const center = await getCenter(session.user.id);
  if (!center) return NextResponse.json({ error: "Center not found" }, { status: 404 });

  const { id } = await params;

  const service = await prisma.diagnosticService.findFirst({
    where: { id, centerId: center.id },
  });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.diagnosticService.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
