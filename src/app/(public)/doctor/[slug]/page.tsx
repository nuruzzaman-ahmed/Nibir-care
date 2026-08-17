import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DoctorProfileView } from "./components/doctor-profile-view";
import { BookingSection } from "./components/booking-section";
import { isSubscriptionActive } from "@/lib/subscription";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug },
    include: { specialties: { include: { specialty: true }, where: { isPrimary: true } } },
  });
  if (!doctor) return { title: "ডাক্তার পাওয়া যায়নি" };
  const specialty = doctor.specialties[0]?.specialty.nameBn ?? "";
  return {
    title: `${doctor.nameBn} — ${specialty}`,
    description: doctor.about ?? `${doctor.nameBn}, ${specialty}। অনলাইনে সিরিয়াল নিন।`,
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const doctor = await prisma.doctorProfile.findUnique({
    where: { slug, isActive: true },
    include: {
      specialties: { include: { specialty: true } },
      location: true,
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, image: true } } },
      },
      chambers: {
        where: { isActive: true },
        include: {
          schedules: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
          center: { select: { id: true, nameBn: true, address: true } },
        },
      },
      subscription: { select: { status: true, endsAt: true } },
    },
  });

  if (!doctor) notFound();

  const bookable = isSubscriptionActive(doctor.subscription);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main profile */}
        <div className="flex-1 min-w-0">
          <DoctorProfileView doctor={doctor} isLoggedIn={!!session} />
        </div>
        {/* Booking sidebar */}
        <div className="lg:w-80 shrink-0">
          <div className="lg:sticky lg:top-24">
            {bookable ? (
              <BookingSection doctor={doctor} session={session} />
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-amber-800">সাময়িকভাবে বুকিং বন্ধ আছে</p>
                <p className="text-xs text-amber-600 mt-1">এই মুহূর্তে নতুন সিরিয়াল নেওয়া যাচ্ছে না</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
