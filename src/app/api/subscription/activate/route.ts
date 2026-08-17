import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { PLAN_CONFIG, type PlanKey } from "@/lib/subscription";

const schema = z.object({
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "DOCTOR" && session.user.role !== "DIAGNOSTIC")) {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অবৈধ রিকোয়েস্ট" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "সঠিক প্ল্যান বেছে নিন" }, { status: 400 });
  }
  const { plan } = parsed.data;
  const config = PLAN_CONFIG[plan as PlanKey];
  const endsAt = new Date(Date.now() + config.durationDays * 86400000);

  let doctorId: string | null = null;
  let centerId: string | null = null;

  if (session.user.role === "DOCTOR") {
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!doctor) return NextResponse.json({ error: "প্রোফাইল পাওয়া যায়নি" }, { status: 404 });
    doctorId = doctor.id;
  } else {
    const center = await prisma.diagnosticCenter.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!center) return NextResponse.json({ error: "প্রোফাইল পাওয়া যায়নি" }, { status: 404 });
    centerId = center.id;
  }

  // NOTE: no real payment gateway is wired up yet — this activates the plan directly.
  // Hook a provider (bKash/Nagad/SSLCommerz) here before charging real money in production.
  const subscription = await prisma.subscription.upsert({
    where: doctorId ? { doctorId } : { centerId: centerId! },
    update: { plan, status: plan === "FREE" ? "TRIALING" : "ACTIVE", startedAt: new Date(), endsAt, cancelledAt: null },
    create: {
      doctorId,
      centerId,
      plan,
      status: plan === "FREE" ? "TRIALING" : "ACTIVE",
      endsAt,
    },
  });

  return NextResponse.json(subscription);
}
