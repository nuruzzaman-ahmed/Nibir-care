import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Shield,
  FlaskConical,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DoctorCard } from "@/components/shared/doctor-card";
import { formatCurrency } from "@/lib/utils";
import { TestBookingPanel } from "./components/test-booking-panel";
import { ReviewsSection } from "./components/reviews-section";
import { isSubscriptionActive } from "@/lib/subscription";
import { mapsLinkFor } from "@/components/location/location-picker";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const center = await prisma.diagnosticCenter.findUnique({ where: { slug } });
  if (!center) return { title: "সেন্টার পাওয়া যায়নি" };
  return {
    title: center.nameBn,
    description: center.about ?? `${center.nameBn} — ডায়াগনস্টিক সেবা`,
  };
}

export default async function DiagnosticProfilePage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const center = await prisma.diagnosticCenter.findUnique({
    where: { slug, isActive: true },
    include: {
      services: { orderBy: { sortOrder: "asc" } },
      doctors: {
        where: { isActive: true },
        include: {
          doctor: {
            include: {
              specialties: { include: { specialty: true }, where: { isPrimary: true } },
              location: true,
            },
          },
        },
      },
      reviews: {
        where: { isVisible: true },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      subscription: { select: { status: true, endsAt: true } },
    },
  });

  if (!center) notFound();

  const bookable = isSubscriptionActive(center.subscription);

  const serviceCategories = Array.from(new Set(center.services.map((s) => s.category ?? "অন্যান্য")));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Header card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <Avatar className="h-24 w-24 rounded-2xl shrink-0">
                  <AvatarImage src={center.logo ?? ""} alt={center.nameBn} />
                  <AvatarFallback className="rounded-2xl text-2xl font-bold bg-teal-50 text-teal-700">
                    {center.nameBn.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {center.verificationStatus === "VERIFIED" && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <Shield className="h-3.5 w-3.5 text-teal-500" />
                          <span className="text-[11px] font-medium text-teal-600">যাচাইকৃত সেন্টার</span>
                        </div>
                      )}
                      <h1 className="text-2xl font-bold text-gray-900">{center.nameBn}</h1>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="text-xl font-bold">{center.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-gray-400">{center.totalReviews} রিভিউ</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                    <span className="flex-1">{center.address}, {center.district}{center.thana ? `, ${center.thana}` : ""}</span>
                    {mapsLinkFor(center) && (
                      <a href={mapsLinkFor(center)!} target="_blank" rel="noopener noreferrer" className="text-teal-600 font-medium hover:underline shrink-0 whitespace-nowrap">
                        Maps-এ দেখুন
                      </a>
                    )}
                  </div>

                  {center.phone && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-teal-600">
                      <Phone className="h-4 w-4 shrink-0" />
                      <a href={`tel:${center.phone}`}>{center.phone}</a>
                    </div>
                  )}

                  {center.openingTime && center.closingTime && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{center.openingTime} — {center.closingTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          {center.about && (
            <Card>
              <CardHeader><CardTitle>সেন্টার সম্পর্কে</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">{center.about}</p>
              </CardContent>
            </Card>
          )}

          {/* Services by category */}
          <Card>
            <CardHeader><CardTitle>সেবা ও মূল্য তালিকা</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {serviceCategories.map((cat) => {
                const catServices = center.services.filter((s) => (s.category ?? "অন্যান্য") === cat);
                return (
                  <div key={cat}>
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">{cat}</h4>
                    <div className="space-y-2">
                      {catServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-start justify-between bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-teal-500" />
                              <span className="font-medium text-gray-900 text-sm">{service.nameBn}</span>
                            </div>
                            {service.preparation && (
                              <p className="text-xs text-gray-500 mt-1 ml-6">{service.preparation}</p>
                            )}
                            {service.reportTime && (
                              <p className="text-xs text-teal-600 mt-1 ml-6">রিপোর্ট: {service.reportTime}</p>
                            )}
                          </div>
                          <div className="text-right ml-3">
                            {service.discountPrice ? (
                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  {formatCurrency(service.discountPrice)}
                                </p>
                                <p className="text-xs line-through text-gray-400">
                                  {formatCurrency(service.price)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(service.price)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Doctors */}
          {center.doctors.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">এই সেন্টারের ডাক্তারগণ</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {center.doctors.map(({ doctor }) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={{ ...doctor, degrees: doctor.degrees ?? null }}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">
            {bookable ? (
              <Card>
                <CardContent className="p-5">
                  <TestBookingPanel
                    centerId={center.id}
                    services={center.services.filter((s) => s.isActive)}
                    isLoggedIn={!!session}
                    defaultPatientName={session?.user.name ?? undefined}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-amber-800">সাময়িকভাবে বুকিং বন্ধ আছে</p>
                <p className="text-xs text-amber-600 mt-1">এই মুহূর্তে নতুন টেস্ট বুকিং নেওয়া যাচ্ছে না</p>
              </div>
            )}

            {/* Reviews */}
            <ReviewsSection centerId={center.id} initialReviews={center.reviews} isLoggedIn={!!session} />
          </div>
        </div>
      </div>
    </div>
  );
}
