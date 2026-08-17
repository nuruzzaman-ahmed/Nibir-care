import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { activePlanFilter } from "@/lib/subscription";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q        = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  const services = await prisma.diagnosticService.findMany({
    where: {
      isActive: true,
      price: { gt: 0 },
      center: {
        verificationStatus: "VERIFIED",
        isActive: true,
        subscription: activePlanFilter(),
      },
      ...(q && {
        OR: [
          { nameBn: { contains: q } },
          { nameEn: { contains: q } },
        ],
      }),
      ...(category && category !== "all" && {
        category: { contains: category },
      }),
    },
    include: {
      center: {
        select: {
          id:          true,
          slug:        true,
          nameBn:      true,
          nameEn:      true,
          district:    true,
          thana:       true,
          phone:       true,
          rating:      true,
          openingTime: true,
          closingTime: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });

  return NextResponse.json(services);
}
