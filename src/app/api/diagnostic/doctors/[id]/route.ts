import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const link = await prisma.centerDoctor.findFirst({
    where: { id, centerId: center.id },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.centerDoctor.update({
    where: { id },
    data: { isActive: body.isActive },
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

  const link = await prisma.centerDoctor.findFirst({
    where: { id, centerId: center.id },
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.centerDoctor.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
