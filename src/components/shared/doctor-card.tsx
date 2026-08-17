import Link from "next/link";
import { MapPin, Clock, Star, BadgeCheck, Calendar, Award, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatCurrency, formatTime } from "@/lib/utils";

type TodayQueue = {
  status: string;
  currentSerial: number;
  totalBooked: number;
  waiting: number;
  avgConsultDuration: number;
};

type DoctorCardProps = {
  doctor: {
    id: string;
    slug: string;
    nameEn: string;
    nameBn: string;
    photo?: string | null;
    verificationStatus: string;
    consultationFee: number;
    experience: number;
    rating: number;
    totalReviews: number;
    isAvailableToday: boolean;
    specialties?: { specialty: { nameEn: string; nameBn: string }; isPrimary: boolean }[];
    degrees?: string | null;
    location?: { district: string; thana?: string | null } | null;
    chambers?: {
      id: string;
      nameBn: string;
      schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
    }[];
  };
  todaySchedule?: { startTime: string; endTime: string } | null;
  todayQueue?: TodayQueue | null;
  compact?: boolean;
};

export function DoctorCard({ doctor, todaySchedule, todayQueue, compact }: DoctorCardProps) {
  const primarySpecialty = doctor.specialties?.find((s) => s.isPrimary) ?? doctor.specialties?.[0];
  let degrees: { title: string }[] = [];
  try {
    degrees = doctor.degrees ? JSON.parse(doctor.degrees) : [];
  } catch {
    degrees = [];
  }

  if (compact) {
    return (
      <Link href={`/doctor/${doctor.slug}`} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all group">
        <Avatar className="h-12 w-12 rounded-xl shrink-0">
          <AvatarImage src={doctor.photo ?? ""} alt={doctor.nameBn} />
          <AvatarFallback className="rounded-xl text-sm font-semibold bg-teal-50 text-teal-700">
            {doctor.nameBn.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-[13px] leading-tight truncate">{doctor.nameBn}</p>
          {primarySpecialty && (
            <p className="text-[11px] text-teal-600 mt-0.5 truncate">{primarySpecialty.specialty.nameBn}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5 text-[11px] text-amber-600 font-semibold">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {doctor.rating.toFixed(1)}
            </span>
            <span className="text-[11px] text-gray-400">{formatCurrency(doctor.consultationFee)}</span>
          </div>
        </div>
        {doctor.verificationStatus === "VERIFIED" && (
          <BadgeCheck className="h-4 w-4 text-teal-500 shrink-0" />
        )}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          {/* Photo */}
          <div className="relative shrink-0">
            <Avatar className="h-16 w-16 rounded-2xl">
              <AvatarImage src={doctor.photo ?? ""} alt={doctor.nameBn} />
              <AvatarFallback className="rounded-2xl text-lg font-bold bg-teal-50 text-teal-700">
                {doctor.nameBn.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {doctor.isAvailableToday && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate flex items-center gap-1">
                  <span className="truncate">{doctor.nameBn}</span>
                  {doctor.verificationStatus === "VERIFIED" && (
                    <BadgeCheck className="h-4 w-4 text-teal-500 shrink-0" />
                  )}
                </h3>
                {primarySpecialty && (
                  <p className="text-[12px] text-teal-700 font-medium mt-0.5 truncate">
                    {primarySpecialty.specialty.nameBn}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-[13px] font-bold text-gray-800">{doctor.rating.toFixed(1)}</span>
              </div>
            </div>

            {degrees.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                {degrees.map((d) => d.title).join(", ")}
              </p>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                {doctor.experience} বছর
              </span>
              <span>·</span>
              <span>{doctor.totalReviews} রিভিউ</span>
              {doctor.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {doctor.location.district}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Schedule + queue chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {todaySchedule && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="font-medium">আজ {formatTime(todaySchedule.startTime)} – {formatTime(todaySchedule.endTime)}</span>
            </div>
          )}
          {todayQueue && todayQueue.status === "RUNNING" && (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg">
              <Users className="h-3 w-3 shrink-0" />
              <span className="font-medium">চলছে #{todayQueue.currentSerial} · {todayQueue.waiting} জন অপেক্ষায়</span>
            </div>
          )}
          {todayQueue && todayQueue.status === "NOT_STARTED" && todayQueue.totalBooked > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">
              <Users className="h-3 w-3 shrink-0" />
              <span className="font-medium">{todayQueue.totalBooked} জন বুক করেছেন</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
        <div>
          <span className="text-[18px] font-extrabold text-gray-900">{formatCurrency(doctor.consultationFee)}</span>
          <span className="text-[11px] text-gray-400 ml-1">ভিজিট</span>
        </div>
        <Link href={`/doctor/${doctor.slug}`}>
          <Button size="sm" className="gap-1.5 text-[13px] h-8 px-3.5 bg-teal-600 hover:bg-teal-700">
            <Calendar className="h-3.5 w-3.5" />
            সিরিয়াল নিন
          </Button>
        </Link>
      </div>
    </div>
  );
}
