"use client";

import { useState } from "react";
import {
  Shield,
  Star,
  Award,
  MapPin,
  Clock,
  Phone,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatTime, getDayName } from "@/lib/utils";
import { mapsLinkFor } from "@/components/location/location-picker";
import { ReviewForm } from "@/components/reviews/review-form";

type Doctor = {
  id: string;
  nameBn: string;
  nameEn: string;
  photo?: string | null;
  verificationStatus: string;
  consultationFee: number;
  followUpFee: number;
  experience: number;
  rating: number;
  totalReviews: number;
  about?: string | null;
  degrees?: string | null;
  services?: string | null;
  gender?: string | null;
  specialties: { specialty: { nameBn: string; nameEn: string }; isPrimary: boolean }[];
  location?: { district: string; thana?: string | null } | null;
  reviews: {
    id: string;
    rating: number;
    comment?: string | null;
    user: { name?: string | null; image?: string | null };
    createdAt: Date | string;
  }[];
  chambers: {
    id: string;
    nameBn: string;
    nameEn: string;
    address: string;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    googleMapUrl?: string | null;
    schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
    center?: { nameBn: string; address: string } | null;
  }[];
};

export function DoctorProfileView({ doctor, isLoggedIn }: { doctor: Doctor; isLoggedIn: boolean }) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviews, setReviews] = useState(doctor.reviews);
  const [ratingInfo, setRatingInfo] = useState({ rating: doctor.rating, totalReviews: doctor.totalReviews });

  let degrees: { title: string; institution?: string; year?: string }[] = [];
  try { degrees = doctor.degrees ? JSON.parse(doctor.degrees) : []; } catch { degrees = []; }

  let services: string[] = [];
  try { services = doctor.services ? JSON.parse(doctor.services) : []; } catch { services = []; }

  const primarySpecialty = doctor.specialties.find((s) => s.isPrimary) ?? doctor.specialties[0];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Photo */}
            <div className="flex flex-col items-center sm:items-start">
              <Avatar className="h-28 w-28 rounded-3xl">
                <AvatarImage src={doctor.photo ?? ""} alt={doctor.nameBn} />
                <AvatarFallback className="rounded-3xl text-3xl">
                  {doctor.nameBn.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {doctor.verificationStatus === "VERIFIED" && (
                <div className="flex items-center gap-1.5 mt-3 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">যাচাইকৃত ডাক্তার</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{doctor.nameBn}</h1>
                  <p className="text-sm text-gray-500 font-medium">{doctor.nameEn}</p>
                  {primarySpecialty && (
                    <p className="text-teal-700 font-semibold mt-1">
                      {primarySpecialty.specialty.nameBn}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="text-xl font-bold text-gray-900">{ratingInfo.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-400">{ratingInfo.totalReviews} রিভিউ</p>
                </div>
              </div>

              {/* Degrees */}
              {degrees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {degrees.map((d, i) => (
                    <span key={i} className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-gray-700 font-medium">
                      {d.title}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center bg-teal-50 rounded-xl p-3">
                  <div className="text-xl font-bold text-teal-700">{doctor.experience}+</div>
                  <div className="text-[11px] text-gray-500">বছর অভিজ্ঞতা</div>
                </div>
                <div className="text-center bg-amber-50 rounded-xl p-3">
                  <div className="text-xl font-bold text-amber-600">{formatCurrency(doctor.consultationFee)}</div>
                  <div className="text-[11px] text-gray-500">ভিজিট ফি</div>
                </div>
                <div className="text-center bg-blue-50 rounded-xl p-3">
                  <div className="text-xl font-bold text-blue-600">{ratingInfo.totalReviews}</div>
                  <div className="text-[11px] text-gray-500">রোগীর রিভিউ</div>
                </div>
              </div>

              {doctor.location && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {doctor.location.district}{doctor.location.thana ? `, ${doctor.location.thana}` : ""}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      {doctor.about && (
        <Card>
          <CardHeader><CardTitle>ডাক্তার সম্পর্কে</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600 leading-relaxed text-sm">{doctor.about}</p>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {services.length > 0 && (
        <Card>
          <CardHeader><CardTitle>সেবাসমূহ</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {services.map((service, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" />
                  {service}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chambers & Schedule */}
      <Card>
        <CardHeader><CardTitle>চেম্বার ও সময়সূচি</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {doctor.chambers.map((chamber, idx) => (
            <div key={chamber.id}>
              {idx > 0 && <Separator className="mb-5" />}
              <div className="flex items-start gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{chamber.nameBn}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{chamber.address}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {chamber.phone && (
                      <p className="text-xs text-teal-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {chamber.phone}
                      </p>
                    )}
                    {mapsLinkFor(chamber) && (
                      <a
                        href={mapsLinkFor(chamber)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Google Maps-এ দেখুন
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="ml-12 space-y-1.5">
                {chamber.schedules.map((sched) => (
                  <div
                    key={`${sched.dayOfWeek}`}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-700 w-24">
                      {getDayName(sched.dayOfWeek)}
                    </span>
                    <span className="text-teal-700 font-medium">
                      {formatTime(sched.startTime)} — {formatTime(sched.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>রোগীদের রিভিউ ({ratingInfo.totalReviews})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReviewForm
            target="doctor"
            targetId={doctor.id}
            isLoggedIn={isLoggedIn}
            onSubmitted={(review, aggregate) => {
              setReviews((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);
              setRatingInfo(aggregate);
            }}
          />
          {displayedReviews.length > 0 && (
            <>
            {displayedReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={review.user.image ?? ""} />
                    <AvatarFallback className="text-xs">
                      {review.user.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">
                        {review.user.name ?? "পরিচয় গোপন"}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.createdAt).toLocaleDateString("bn-BD")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="w-full text-center text-sm text-teal-600 hover:text-teal-700 py-2 flex items-center justify-center gap-1"
              >
                {showAllReviews ? (
                  <><ChevronUp className="h-4 w-4" /> কম দেখুন</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> সব রিভিউ দেখুন ({reviews.length})</>
                )}
              </button>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
