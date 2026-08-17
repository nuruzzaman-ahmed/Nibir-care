"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatTime, getDayName, getTodayDayOfWeek, getTodayDateString } from "@/lib/utils";

type Chamber = {
  id: string;
  nameBn: string;
  address: string;
  appointmentType: string;
  slotDuration: number;
  dailyLimit: number;
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
};

type BookingSectionProps = {
  doctor: {
    id: string;
    slug: string;
    nameBn: string;
    consultationFee: number;
    followUpFee: number;
    chambers: Chamber[];
  };
  session: { user: { id: string; role: string } } | null;
};

export function BookingSection({ doctor, session }: BookingSectionProps) {
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(
    doctor.chambers[0] ?? null
  );

  const today = getTodayDayOfWeek();
  const todayDate = getTodayDateString();

  const todaySchedule = selectedChamber?.schedules.find(
    (s) => s.dayOfWeek === today
  );

  if (doctor.chambers.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            এই ডাক্তারের কোনো সক্রিয় চেম্বার নেই
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fee card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">ভিজিট ফি</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(doctor.consultationFee)}
              </p>
            </div>
            {doctor.followUpFee > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-400">ফলো-আপ</p>
                <p className="text-lg font-semibold text-teal-700">
                  {formatCurrency(doctor.followUpFee)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chamber selector */}
      {doctor.chambers.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">চেম্বার বেছে নিন</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {doctor.chambers.map((chamber) => (
              <button
                key={chamber.id}
                onClick={() => setSelectedChamber(chamber)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selectedChamber?.id === chamber.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <p className="font-semibold text-sm text-gray-900">
                  {chamber.nameBn}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{chamber.address}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today's schedule */}
      {selectedChamber && (
        <Card>
          <CardHeader><CardTitle className="text-base">আজকের সময়সূচি</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {selectedChamber.nameBn}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedChamber.address}
                </p>
              </div>
            </div>

            {todaySchedule ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">
                    {formatTime(todaySchedule.startTime)} — {formatTime(todaySchedule.endTime)}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">আজ চেম্বার আছে</p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">আজ এই চেম্বারে নেই</p>
                <p className="text-xs text-gray-400 mt-1">অন্য দিন বেছে নিন</p>
              </div>
            )}

            {/* Weekly schedule mini */}
            <div className="mt-4 space-y-1.5">
              {selectedChamber.schedules.slice(0, 5).map((sched) => (
                <div
                  key={sched.dayOfWeek}
                  className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg ${
                    sched.dayOfWeek === today
                      ? "bg-teal-50 text-teal-700 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  <span>{getDayName(sched.dayOfWeek)}</span>
                  <span>
                    {formatTime(sched.startTime)}–{formatTime(sched.endTime)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      {session ? (
        <Link href={`/book/${doctor.slug}?chamber=${selectedChamber?.id}&date=${todayDate}`}>
          <Button className="w-full h-13 text-base gap-2" size="lg">
            <Calendar className="h-5 w-5" />
            সিরিয়াল নিন
          </Button>
        </Link>
      ) : (
        <div className="space-y-2">
          <Link href={`/login?callbackUrl=/doctor/${doctor.slug}`}>
            <Button className="w-full h-13 text-base gap-2" size="lg">
              <Calendar className="h-5 w-5" />
              সিরিয়াল নিন
            </Button>
          </Link>
          <p className="text-xs text-center text-gray-400">
            সিরিয়াল নিতে{" "}
            <Link href="/login" className="text-teal-600 underline">
              লগইন
            </Link>{" "}
            করুন
          </p>
        </div>
      )}
    </div>
  );
}
