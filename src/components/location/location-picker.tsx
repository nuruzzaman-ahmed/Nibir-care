"use client";

import { useState } from "react";
import { MapPin, LocateFixed, ExternalLink, Loader2 } from "lucide-react";

export type LocationValue = {
  latitude: number | null;
  longitude: number | null;
  googleMapUrl: string;
};

function embedUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}

export function mapsLinkFor(value: { latitude?: number | null; longitude?: number | null; googleMapUrl?: string | null }): string | null {
  if (value.googleMapUrl && value.googleMapUrl.trim()) return value.googleMapUrl.trim();
  if (value.latitude != null && value.longitude != null) {
    return `https://www.google.com/maps?q=${value.latitude},${value.longitude}`;
  }
  return null;
}

export function LocationPicker({ value, onChange }: { value: LocationValue; onChange: (v: LocationValue) => void }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("আপনার ব্রাউজার লোকেশন সাপোর্ট করে না");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ ...value, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("লোকেশন পাওয়া যায়নি — ব্রাউজারে লোকেশন অনুমতি দিন");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasCoords = value.latitude != null && value.longitude != null;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">চেম্বার/সেন্টারের সঠিক অবস্থান</label>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 transition-colors disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {locating ? "অবস্থান খোঁজা হচ্ছে..." : "বর্তমান অবস্থান ব্যবহার করুন"}
        </button>
        {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            placeholder="২৩.৮১০৩"
            value={value.latitude ?? ""}
            onChange={(e) => onChange({ ...value, latitude: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            placeholder="৯০.৪১২৫"
            value={value.longitude ?? ""}
            onChange={(e) => onChange({ ...value, longitude: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-1">অথবা Google Maps লিংক পেস্ট করুন (ঐচ্ছিক)</label>
        <input
          type="url"
          placeholder="https://maps.google.com/..."
          value={value.googleMapUrl}
          onChange={(e) => onChange({ ...value, googleMapUrl: e.target.value })}
          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {hasCoords && (
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <iframe
            title="location-preview"
            src={embedUrl(value.latitude!, value.longitude!)}
            width="100%"
            height="180"
            style={{ border: 0 }}
            loading="lazy"
          />
          <a
            href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Google Maps-এ দেখুন
          </a>
        </div>
      )}

      {!hasCoords && (
        <div className="flex items-center gap-2 text-[12px] text-gray-400 bg-gray-50 rounded-xl px-3 py-3">
          <MapPin className="h-4 w-4 shrink-0" />
          এখনো কোনো অবস্থান সেট করা হয়নি
        </div>
      )}
    </div>
  );
}
