"use client";

import { useState } from "react";
import { MapPin, Clock, Users, Plus, X, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocationPicker, mapsLinkFor, type LocationValue } from "@/components/location/location-picker";

const DAY_NAMES = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];

type Schedule = { id?: string; dayOfWeek: number; startTime: string; endTime: string };
type Chamber = {
  id: string;
  nameBn: string;
  nameEn: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapUrl: string | null;
  dailyLimit: number;
  avgConsultDuration: number;
  breakStartTime: string | null;
  breakEndTime: string | null;
  isActive: boolean;
  schedules: Schedule[];
};

type FormState = {
  nameBn: string;
  nameEn: string;
  address: string;
  phone: string;
  location: LocationValue;
  dailyLimit: string;
  avgConsultDuration: string;
  breakStartTime: string;
  breakEndTime: string;
  activeDays: Record<number, { on: boolean; startTime: string; endTime: string }>;
};

function emptyForm(): FormState {
  const activeDays: FormState["activeDays"] = {};
  for (let i = 0; i < 7; i++) activeDays[i] = { on: false, startTime: "17:00", endTime: "21:00" };
  return {
    nameBn: "",
    nameEn: "",
    address: "",
    phone: "",
    location: { latitude: null, longitude: null, googleMapUrl: "" },
    dailyLimit: "30",
    avgConsultDuration: "10",
    breakStartTime: "",
    breakEndTime: "",
    activeDays,
  };
}

function chamberToForm(c: Chamber): FormState {
  const activeDays: FormState["activeDays"] = {};
  for (let i = 0; i < 7; i++) activeDays[i] = { on: false, startTime: "17:00", endTime: "21:00" };
  for (const s of c.schedules) {
    activeDays[s.dayOfWeek] = { on: true, startTime: s.startTime, endTime: s.endTime };
  }
  return {
    nameBn: c.nameBn,
    nameEn: c.nameEn,
    address: c.address,
    phone: c.phone ?? "",
    location: { latitude: c.latitude, longitude: c.longitude, googleMapUrl: c.googleMapUrl ?? "" },
    dailyLimit: String(c.dailyLimit),
    avgConsultDuration: String(c.avgConsultDuration),
    breakStartTime: c.breakStartTime ?? "",
    breakEndTime: c.breakEndTime ?? "",
    activeDays,
  };
}

export function ChambersClient({ chambers: initialChambers }: { chambers: Chamber[] }) {
  const [chambers, setChambers] = useState(initialChambers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setError(""); setShowForm(true); };
  const openEdit = (c: Chamber) => { setEditingId(c.id); setForm(chamberToForm(c)); setError(""); setShowForm(true); };
  const closeForm = () => setShowForm(false);

  const handleSave = async () => {
    setError("");
    if (!form.nameBn || !form.nameEn || !form.address) { setError("নাম ও ঠিকানা দিন"); return; }
    const schedules = Object.entries(form.activeDays)
      .filter(([, v]) => v.on)
      .map(([day, v]) => ({ dayOfWeek: Number(day), startTime: v.startTime, endTime: v.endTime }));
    if (schedules.length === 0) { setError("কমপক্ষে ১টি দিনের সময়সূচী দিন"); return; }

    setSaving(true);
    try {
      const body = {
        nameBn: form.nameBn,
        nameEn: form.nameEn,
        address: form.address,
        phone: form.phone || undefined,
        latitude: form.location.latitude,
        longitude: form.location.longitude,
        googleMapUrl: form.location.googleMapUrl || undefined,
        dailyLimit: parseInt(form.dailyLimit) || 30,
        avgConsultDuration: parseInt(form.avgConsultDuration) || 10,
        breakStartTime: form.breakStartTime || undefined,
        breakEndTime: form.breakEndTime || undefined,
        schedules,
      };

      const res = editingId
        ? await fetch(`/api/doctor/chambers/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/doctor/chambers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "তথ্য সংরক্ষণ করা যায়নি");
        return;
      }
      const saved = await res.json();
      setChambers((prev) => (editingId ? prev.map((c) => (c.id === editingId ? saved : c)) : [...prev, saved]));
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই চেম্বারটি মুছে ফেলতে চান? সব সময়সূচী মুছে যাবে।")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/doctor/chambers/${id}`, { method: "DELETE" });
      if (res.ok) setChambers((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">চেম্বার</h1>
          <p className="text-sm text-gray-500 mt-0.5">আপনার নিবন্ধিত চেম্বারসমূহ</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4" />
          নতুন চেম্বার
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">{editingId ? "চেম্বার সম্পাদনা" : "নতুন চেম্বার যোগ করুন"}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">নাম (বাংলা) *</label>
                  <input value={form.nameBn} onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))}
                    placeholder="সিটি হেলথ চেম্বার" className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Name (English) *</label>
                  <input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="City Health Chamber" className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ঠিকানা *</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="বাড়ি/রোড, এলাকা, শহর" className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ফোন নম্বর</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="01XXXXXXXXX" className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <LocationPicker value={form.location} onChange={(location) => setForm((f) => ({ ...f, location }))} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">দৈনিক সিরিয়াল সীমা</label>
                  <input type="number" value={form.dailyLimit} onChange={(e) => setForm((f) => ({ ...f, dailyLimit: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">প্রতি রোগী সময় (মি.)</label>
                  <input type="number" value={form.avgConsultDuration} onChange={(e) => setForm((f) => ({ ...f, avgConsultDuration: e.target.value }))}
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-2">সাপ্তাহিক সময়সূচী *</label>
                <div className="space-y-1.5">
                  {DAY_NAMES.map((day, idx) => {
                    const d = form.activeDays[idx];
                    return (
                      <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl border ${d.on ? "border-teal-200 bg-teal-50/50" : "border-gray-100"}`}>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, activeDays: { ...f.activeDays, [idx]: { ...f.activeDays[idx], on: !f.activeDays[idx].on } } }))}
                          className={`w-14 shrink-0 text-[12px] font-semibold py-1 rounded-lg ${d.on ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          {day}
                        </button>
                        {d.on && (
                          <>
                            <input type="time" value={d.startTime}
                              onChange={(e) => setForm((f) => ({ ...f, activeDays: { ...f.activeDays, [idx]: { ...f.activeDays[idx], startTime: e.target.value } } }))}
                              className="flex-1 px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg" />
                            <span className="text-gray-300 text-xs">—</span>
                            <input type="time" value={d.endTime}
                              onChange={(e) => setForm((f) => ({ ...f, activeDays: { ...f.activeDays, [idx]: { ...f.activeDays[idx], endTime: e.target.value } } }))}
                              className="flex-1 px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <Button variant="outline" onClick={closeForm} className="flex-1">বাতিল</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 hover:bg-teal-700">
                {saving ? "সংরক্ষণ হচ্ছে..." : editingId ? "আপডেট করুন" : "যোগ করুন"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {chambers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো চেম্বার নেই</h3>
          <p className="text-sm text-gray-400 mb-5">রোগীরা সিরিয়াল নিতে পারবে একটি চেম্বার যোগ করলে</p>
          <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1.5" />নতুন চেম্বার যোগ করুন</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {chambers.map((chamber) => {
            const mapLink = mapsLinkFor(chamber);
            return (
              <Card key={chamber.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{chamber.nameBn}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{chamber.nameEn}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={chamber.isActive ? "success" : "destructive"}>
                        {chamber.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                      <button onClick={() => openEdit(chamber)} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(chamber.id)} disabled={deleting === chamber.id} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                    <span className="flex-1">{chamber.address}</span>
                    {mapLink && (
                      <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      দৈনিক সীমা: {chamber.dailyLimit}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-2">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      প্রতি রোগী: ~{chamber.avgConsultDuration} মি.
                    </div>
                  </div>

                  {chamber.schedules.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-1.5">সময়সূচী</p>
                      <div className="space-y-1">
                        {chamber.schedules.map((sch) => (
                          <div key={sch.id ?? `${sch.dayOfWeek}`} className="flex items-center gap-2 text-xs text-gray-700">
                            <span className="w-10 font-medium">{DAY_NAMES[sch.dayOfWeek]}</span>
                            <span className="text-gray-400">→</span>
                            <span>{sch.startTime} — {sch.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
