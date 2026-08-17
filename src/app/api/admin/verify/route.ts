import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  entityType: z.enum(["DOCTOR", "DIAGNOSTIC"]),
  entityId: z.string(),
  action: z.enum(["VERIFY", "REJECT", "SUSPEND"]),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  const statusMap = {
    VERIFY: "VERIFIED",
    REJECT: "REJECTED",
    SUSPEND: "SUSPENDED",
  };
  const newStatus = statusMap[data.action];

  if (data.entityType === "DOCTOR") {
    await prisma.doctorProfile.update({
      where: { id: data.entityId },
      data: {
        verificationStatus: newStatus,
        verifiedAt: data.action === "VERIFY" ? new Date() : null,
      },
    });
  } else {
    await prisma.diagnosticCenter.update({
      where: { id: data.entityId },
      data: {
        verificationStatus: newStatus,
        verifiedAt: data.action === "VERIFY" ? new Date() : null,
      },
    });
  }

  await prisma.verificationLog.create({
    data: {
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action === "VERIFY" ? "VERIFIED" : data.action === "REJECT" ? "REJECTED" : "SUSPENDED",
      adminNote: data.note,
      performedBy: session.user.id,
    },
  });

  // Notify the entity owner
  const profile =
    data.entityType === "DOCTOR"
      ? await prisma.doctorProfile.findUnique({ where: { id: data.entityId }, include: { user: true } })
      : await prisma.diagnosticCenter.findUnique({ where: { id: data.entityId }, include: { user: true } });

  if (profile) {
    const title = data.action === "VERIFY" ? "অ্যাকাউন্ট যাচাই হয়েছে!" : "যাচাই সমস্যা";
    const body_msg =
      data.action === "VERIFY"
        ? "আপনার অ্যাকাউন্ট সফলভাবে যাচাই হয়েছে। এখন থেকে আপনার প্রোফাইল দেখা যাবে।"
        : `আপনার অ্যাকাউন্ট যাচাই করা সম্ভব হয়নি। ${data.note ?? ""}`;

    await prisma.notification.create({
      data: {
        userId: profile.user.id,
        type: "GENERAL",
        title,
        body: body_msg,
      },
    });
  }

  return NextResponse.json({ success: true });
}
