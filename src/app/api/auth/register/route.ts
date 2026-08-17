import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  phone: z.string().min(11, "সঠিক মোবাইল নম্বর দিন"),
  password: z.string().min(8),
  role: z.enum(["PATIENT", "DOCTOR", "DIAGNOSTIC"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const name = data.name?.trim() || data.email.split("@")[0];

    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "এই ইমেইল বা ফোন নম্বর দিয়ে আগেই অ্যাকাউন্ট আছে" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
      },
    });

    // Trial subscription: 1 month free, for DOCTOR/DIAGNOSTIC roles only
    const trialEndsAt = new Date(Date.now() + 30 * 86400000);

    // Create role-specific profile
    if (data.role === "PATIENT") {
      await prisma.patientProfile.create({
        data: { userId: user.id, nameEn: name, nameBn: name },
      });
    } else if (data.role === "DOCTOR") {
      const slug = `dr-${name.toLowerCase().replace(/\s+/g, "-")}-${user.id.slice(-6)}`;
      const doctor = await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          slug,
          nameEn: name,
          nameBn: name,
          verificationStatus: "PENDING",
        },
      });
      await prisma.subscription.create({
        data: { doctorId: doctor.id, plan: "FREE", status: "TRIALING", endsAt: trialEndsAt },
      });
    } else if (data.role === "DIAGNOSTIC") {
      const slug = `center-${name.toLowerCase().replace(/\s+/g, "-")}-${user.id.slice(-6)}`;
      const center = await prisma.diagnosticCenter.create({
        data: {
          userId: user.id,
          slug,
          nameEn: name,
          nameBn: name,
          address: "",
          division: "",
          district: "",
          verificationStatus: "PENDING",
        },
      });
      await prisma.subscription.create({
        data: { centerId: center.id, plan: "FREE", status: "TRIALING", endsAt: trialEndsAt },
      });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "তথ্য সঠিক নয়" }, { status: 400 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "সার্ভার ত্রুটি" }, { status: 500 });
  }
}
