import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z
  .object({
    doctorId: z.string().optional(),
    centerId: z.string().optional(),
    rating: z.number().min(1).max(5),
    comment: z.string().max(1000).optional(),
  })
  .refine((d) => (d.doctorId ? !d.centerId : !!d.centerId), {
    message: "একটি doctorId অথবা centerId দিন",
  });

async function recomputeRating(target: "doctor" | "center", id: string) {
  const agg = await prisma.review.aggregate({
    where: target === "doctor" ? { doctorId: id, isVisible: true } : { centerId: id, isVisible: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const rating = agg._avg.rating ?? 0;
  const totalReviews = agg._count.rating;
  if (target === "doctor") {
    await prisma.doctorProfile.update({ where: { id }, data: { rating, totalReviews } });
  } else {
    await prisma.diagnosticCenter.update({ where: { id }, data: { rating, totalReviews } });
  }
  return { rating, totalReviews };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "রিভিউ দিতে লগইন করুন" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "সঠিক তথ্য দিন" }, { status: 400 });
  }
  const { doctorId, centerId, rating, comment } = parsed.data;

  const review = await prisma.review.upsert({
    where: doctorId
      ? { userId_doctorId: { userId: session.user.id, doctorId } }
      : { userId_centerId: { userId: session.user.id, centerId: centerId! } },
    update: { rating, comment: comment || null },
    create: {
      userId: session.user.id,
      doctorId: doctorId || null,
      centerId: centerId || null,
      rating,
      comment: comment || null,
    },
    include: { user: { select: { name: true, image: true } } },
  });

  const aggregate = doctorId
    ? await recomputeRating("doctor", doctorId)
    : await recomputeRating("center", centerId!);

  return NextResponse.json({ review, aggregate });
}
