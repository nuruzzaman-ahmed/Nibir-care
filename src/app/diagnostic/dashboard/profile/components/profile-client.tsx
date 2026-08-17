"use client";

import { useState } from "react";
import { Building2, MapPin, Phone, Clock, CheckCircle2, AlertCircle, Edit2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationPicker, mapsLinkFor, type LocationValue } from "@/components/location/location-picker";

const DAY_OPTIONS = [
  { value: "SAT", label: "শনি" }, { value: "SUN", label: "রবি" }, { value: "MON", label: "সোম" },
  { value: "TUE", label: "মঙ্গল" }, { value: "WED", label: "বুধ" }, { value: "THU", label: "বৃহস্পতি" }, { value: "FRI", label: "শুক্র" },
];

type Center = {
  nameBn: string; nameEn: string; about: string | null;
  phone: string | null; email: string | null;
  address: string; division: string; district: string; thana: string | null;
  openingTime: string | null; closingTime: string | null; openDays: string | null;
  latitude: number | null; longitude: number | null; googleMapUrl: string | null;
  verificationStatus: string;
};

export function DiagnosticProfileClient({ center: initialCenter }: { center: Center }) {
  const [center, setCenter] = useState(initialCenter);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const initialOpenDays = center.openDays ? (JSON.parse(center.openDays) as string[]) : [];
  const [form, setForm] = useState({
    nameBn: center.nameBn,
    nameEn: center.nameEn,
    about: center.about ?? "",
    phone: center.phone ?? "",
    email: center.email ?? "",
    address: center.address,
    division: center.division,
    district: center.district,
    thana: center.thana ?? "",
    openingTime: center.openingTime ?? "",
    closingTime: center.closingTime ?? "",
    openDays: initialOpenDays,
    location: { latitude: center.latitude, longitude: center.longitude, googleMapUrl: center.googleMapUrl ?? "" } as LocationValue,
  });

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      openDays: f.openDays.includes(day) ? f.openDays.filter((d) => d !== day) : [...f.openDays, day],
    }));
  };

  const save = async () => {
    setError("");
    if (!form.nameBn || !form.nameEn || !form.address || !form.division || !form.district) {
      setError("প্রয়োজনীয় সব তথ্য দিন");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/diagnostic/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: form.nameBn,
          nameEn: form.nameEn,
          about: form.about || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address,
          division: form.division,
          district: form.district,
          thana: form.thana || undefined,
          openingTime: form.openingTime || undefined,
          closingTime: form.closingTime || undefined,
          openDays: form.openDays,
          latitude: form.location.latitude,
          longitude: form.location.longitude,
          googleMapUrl: form.location.googleMapUrl || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "সংরক্ষণ করা যায়নি");
        return;
      }
      const updated = await res.json();
      setCenter(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const dayNames: Record<string, string> = { SUN: "রবি", MON: "সোম", TUE: "মঙ্গল", WED: "বুধ", THU: "বৃহস্পতি", FRI: "শুক্র", SAT: "শনি" };
  const openDays = center.openDays ? (JSON.parse(center.openDays) as string[]) : [];
  const mapLink = mapsLinkFor(center);

  if (editing) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">প্রোফাইল সম্পাদনা</h1>
          <button onClick={() => setEditing(false)} className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">নাম (বাংলা) *</label>
              <input value={form.nameBn} onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Name (English) *</label>
              <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">পরিচিতি</label>
            <textarea value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} rows={3}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ফোন</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ইমেইল</label>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ঠিকানা *</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">বিভাগ *</label>
              <input value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">জেলা *</label>
              <input value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">থানা</label>
              <input value={form.thana} onChange={(e) => setForm((f) => ({ ...f, thana: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <LocationPicker value={form.location} onChange={(location) => setForm((f) => ({ ...f, location }))} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">খোলার সময়</label>
              <input type="time" value={form.openingTime} onChange={(e) => setForm((f) => ({ ...f, openingTime: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">বন্ধের সময়</label>
              <input type="time" value={form.closingTime} onChange={(e) => setForm((f) => ({ ...f, closingTime: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-2">খোলার দিন</label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_OPTIONS.map((d) => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${form.openDays.includes(d.value) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">বাতিল</Button>
            <Button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">কেন্দ্রের প্রোফাইল</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার ডায়াগনস্টিক কেন্দ্রের তথ্য</p>
        </div>
        <Button size="sm" onClick={() => setEditing(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
          <Edit2 className="h-3.5 w-3.5" /> সম্পাদনা
        </Button>
      </div>

      <div className={`mb-5 rounded-2xl p-4 flex items-start gap-3 ${center.verificationStatus === "VERIFIED" ? "bg-emerald-50 border border-emerald-100" : "bg-amber-50 border border-amber-100"}`}>
        {center.verificationStatus === "VERIFIED" ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />}
        <div>
          <p className={`text-sm font-semibold ${center.verificationStatus === "VERIFIED" ? "text-emerald-800" : "text-amber-800"}`}>
            {center.verificationStatus === "VERIFIED" ? "যাচাইকৃত কেন্দ্র" : center.verificationStatus === "PENDING" ? "যাচাই প্রক্রিয়াধীন" : center.verificationStatus === "UNDER_REVIEW" ? "পর্যালোচনায় আছে" : "যাচাই প্রয়োজন"}
          </p>
          <p className={`text-xs mt-0.5 ${center.verificationStatus === "VERIFIED" ? "text-emerald-600" : "text-amber-600"}`}>
            {center.verificationStatus === "VERIFIED" ? "আপনার কেন্দ্র DOC&TEST-এ যাচাইকৃত হিসেবে তালিকাভুক্ত।" : "আমাদের টিম আপনার তথ্য যাচাই করছে।"}
          </p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-base">কেন্দ্রের তথ্য</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-xs text-gray-400">নাম (বাংলা)</p><p className="text-sm font-semibold text-gray-900">{center.nameBn}</p></div>
          <div><p className="text-xs text-gray-400">Name (English)</p><p className="text-sm font-semibold text-gray-900">{center.nameEn}</p></div>
          {center.about && <div><p className="text-xs text-gray-400">পরিচিতি</p><p className="text-sm text-gray-700">{center.about}</p></div>}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-500" /> ঠিকানা</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-400">ঠিকানা</span><span className="text-gray-800 font-medium text-right max-w-[60%]">{center.address}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">জেলা</span><span className="text-gray-800 font-medium">{center.district}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">বিভাগ</span><span className="text-gray-800 font-medium">{center.division}</span></div>
          {center.thana && <div className="flex justify-between text-sm"><span className="text-gray-400">থানা/উপজেলা</span><span className="text-gray-800 font-medium">{center.thana}</span></div>}
          {mapLink && (
            <a href={mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 mt-2 py-2 text-[12px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              <MapPin className="h-3.5 w-3.5" /> Google Maps-এ দেখুন
            </a>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-gray-500" /> সময়সূচী</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {center.openingTime && center.closingTime && (
            <div className="flex justify-between text-sm"><span className="text-gray-400">খোলার সময়</span><span className="text-gray-800 font-medium">{center.openingTime} — {center.closingTime}</span></div>
          )}
          {openDays.length > 0 && (
            <div><p className="text-xs text-gray-400 mb-1.5">খোলার দিন</p>
              <div className="flex flex-wrap gap-1.5">{openDays.map((d) => <span key={d} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">{dayNames[d] ?? d}</span>)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" /> যোগাযোগ</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {center.phone && <div className="flex justify-between text-sm"><span className="text-gray-400">ফোন</span><a href={`tel:${center.phone}`} className="text-blue-600 font-medium">{center.phone}</a></div>}
          {center.email && <div className="flex justify-between text-sm"><span className="text-gray-400">ইমেইল</span><a href={`mailto:${center.email}`} className="text-blue-600 font-medium">{center.email}</a></div>}
          {!center.phone && !center.email && <p className="text-sm text-gray-400">কোনো যোগাযোগের তথ্য নেই</p>}
        </CardContent>
      </Card>
    </div>
  );
}
