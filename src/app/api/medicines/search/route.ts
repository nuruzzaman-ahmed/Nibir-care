import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json([]);

  const medicines = await prisma.medicine.findMany({
    where: {
      isActive: true,
      OR: [
        { nameEn: { contains: q } },
        { genericName: { contains: q } },
        { nameBn: { contains: q } },
      ],
    },
    take: 15,
    orderBy: { nameEn: "asc" },
    select: {
      id: true,
      nameEn: true,
      nameBn: true,
      genericName: true,
      type: true,
      strength: true,
      brandNames: true,
    },
  });

  return NextResponse.json(medicines);
}
