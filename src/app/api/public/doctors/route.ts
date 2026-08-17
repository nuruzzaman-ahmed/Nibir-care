import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTodayDayOfWeek, getTodayDateString } from "@/lib/utils";
import { activePlanFilter } from "@/lib/subscription";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q") || "";
  const specialty = searchParams.get("specialty") || "";
  const gender    = searchParams.get("gender") || "";
  const sort      = searchParams.get("sort") || "";

  const today     = getTodayDayOfWeek();
  const todayDate = getTodayDateString();

  const doctors = await prisma.doctorProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      isActive: true,
      // Only show if doctor has at least 1 active chamber with location + schedule set
      chambers: {
        some: {
          isActive: true,
          schedules: { some: { isActive: true } },
        },
      },
      location: { isNot: null }, // must have location set
      subscription: activePlanFilter(), // must have an active plan (not expired)
      ...(q && {
        OR: [
          { nameBn: { contains: q } },
          { nameEn: { contains: q } },
          {
            specialties: {
              some: {
                specialty: {
                  OR: [
                    { nameBn: { contains: q } },
                    { nameEn: { contains: q } },
                  ],
                },
              },
            },
          },
        ],
      }),
      ...(specialty && specialty !== "all" && {
        specialties: { some: { specialty: { slug: specialty } } },
      }),
      ...(gender && { gender }),
    },
    orderBy:
      sort === "fee_asc"
        ? { consultationFee: "asc" }
        : sort === "fee_desc"
        ? { consultationFee: "desc" }
        : sort === "experience"
        ? { experience: "desc" }
        : [{ rating: "desc" }, { totalReviews: "desc" }],
    include: {
      specialties: {
        include: { specialty: true },
        where: { isPrimary: true },
      },
      location: true,
      chambers: {
        where: { isActive: true },
        take: 1,
        include: {
          schedules: { where: { isActive: true } },
          queues: {
            where: { date: todayDate },
            select: {
              currentSerial: true,
              totalBooked: true,
              status: true,
              avgConsultDuration: true,
            },
          },
        },
      },
    },
  });

  const result = doctors.map((doc) => {
    const chamber      = doc.chambers[0] ?? null;
    const todaySchedule = chamber?.schedules.find((s) => s.dayOfWeek === today) ?? null;
    const todayQueue    = chamber?.queues[0] ?? null;
    const waiting       = todayQueue
      ? Math.max(0, todayQueue.totalBooked - todayQueue.currentSerial)
      : 0;

    return {
      id:                 doc.id,
      slug:               doc.slug,
      nameEn:             doc.nameEn,
      nameBn:             doc.nameBn,
      photo:              doc.photo,
      verificationStatus: doc.verificationStatus,
      consultationFee:    doc.consultationFee,
      experience:         doc.experience,
      rating:             doc.rating,
      totalReviews:       doc.totalReviews,
      isAvailableToday:   doc.isAvailableToday,
      degrees:            doc.degrees,
      specialties:        doc.specialties,
      location:           doc.location,
      chambers:           doc.chambers,
      todaySchedule,
      todayQueue: todayQueue
        ? {
            status:             todayQueue.status,
            currentSerial:      todayQueue.currentSerial,
            totalBooked:        todayQueue.totalBooked,
            waiting,
            avgConsultDuration: todayQueue.avgConsultDuration,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}
