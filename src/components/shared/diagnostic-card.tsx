import Link from "next/link";
import { MapPin, Star, BadgeCheck, Clock, ChevronRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type DiagnosticCardProps = {
  center: {
    id: string;
    slug: string;
    nameEn: string;
    nameBn: string;
    logo?: string | null;
    verificationStatus: string;
    rating: number;
    totalReviews: number;
    district: string;
    thana?: string | null;
    address: string;
    openingTime?: string | null;
    closingTime?: string | null;
    services?: { nameEn: string; nameBn: string; price: number }[];
  };
};

export function DiagnosticCard({ center }: DiagnosticCardProps) {
  const isOpen = true; // TODO: derive from openingTime/closingTime vs current time

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-14 w-14 rounded-2xl shrink-0">
            <AvatarImage src={center.logo ?? ""} alt={center.nameBn} />
            <AvatarFallback className="rounded-2xl text-lg font-bold bg-teal-50 text-teal-700">
              {center.nameBn.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-[15px] leading-tight line-clamp-2 flex items-center gap-1">
                  <span className="truncate">{center.nameBn}</span>
                  {center.verificationStatus === "VERIFIED" && (
                    <BadgeCheck className="h-4 w-4 text-teal-500 shrink-0" />
                  )}
                </h3>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-[13px] font-bold text-gray-800">{center.rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {center.district}{center.thana ? `, ${center.thana}` : ""}
              </span>
              {center.openingTime && center.closingTime && (
                <span className={`flex items-center gap-1 font-medium ${isOpen ? "text-emerald-600" : "text-red-500"}`}>
                  <Clock className="h-3 w-3 shrink-0" />
                  {isOpen ? "খোলা" : "বন্ধ"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        {center.services && center.services.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {center.services.slice(0, 3).map((service) => (
              <span
                key={service.nameEn}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100"
              >
                <FlaskConical className="h-2.5 w-2.5" />
                {service.nameBn}
              </span>
            ))}
            {center.services.length > 3 && (
              <span className="inline-flex text-[11px] text-gray-400 px-1 py-0.5">
                +{center.services.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
        <span className="text-[11px] text-gray-400">{center.totalReviews} রিভিউ</span>
        <Link href={`/diagnostic/${center.slug}`}>
          <Button size="sm" variant="outline" className="gap-1 text-[13px] h-8 px-3 border-teal-200 text-teal-700 hover:bg-teal-50">
            বিস্তারিত
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
