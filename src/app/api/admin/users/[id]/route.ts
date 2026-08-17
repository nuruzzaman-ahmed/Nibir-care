import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  isActive: z.boolean(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "নিজের অ্যাকাউন্ট পরিবর্তন করা যাবে না" }, { status: 400 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: data.isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json(user);
}
