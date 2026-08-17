"use client";

import { useState } from "react";
import { Mail, Phone, Droplet, MapPin, Edit2, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Patient = {
  nameBn: string | null;
  nameEn: string | null;
  gender: string | null;
  bloodGroup: string | null;
  address: string | null;
  division: string | null;
  district: string | null;
  thana: string | null;
  user: { phone: string | null; email: string | null };
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function ProfileClient({ patient: initialPatient }: { patient: Patient }) {
  const [patient, setPatient] = useState(initialPatient);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nameBn: patient.nameBn ?? "",
    phone: patient.user.phone ?? "",
    gender: patient.gender ?? "",
    bloodGroup: patient.bloodGroup ?? "",
    address: patient.address ?? "",
    division: patient.division ?? "",
    district: patient.district ?? "",
    thana: patient.thana ?? "",
  });

  const save = async () => {
    if (!form.nameBn.trim()) { setError("নাম দিন"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameBn: form.nameBn,
          phone: form.phone || undefined,
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          address: form.address || undefined,
          division: form.division || undefined,
          district: form.district || undefined,
          thana: form.thana || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "সংরক্ষণ করা যায়নি"); return; }
      setPatient({ ...patient, nameBn: data.nameBn, nameEn: data.nameEn, gender: data.gender, bloodGroup: data.bloodGroup, address: data.address, division: data.division, district: data.district, thana: data.thana, user: { ...patient.user, phone: form.phone || null } });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">প্রোফাইল সম্পাদনা</h1>
          <button onClick={() => setEditing(false)} className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">নাম *</label>
            <input value={form.nameBn} onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ফোন নম্বর</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">লিঙ্গ</label>
              <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">বেছে নিন</option>
                <option value="MALE">পুরুষ</option>
                <option value="FEMALE">মহিলা</option>
                <option value="OTHER">অন্যান্য</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">রক্তের গ্রুপ</label>
              <select value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">বেছে নিন</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">ঠিকানা</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">বিভাগ</label>
              <input value={form.division} onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">জেলা</label>
              <input value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">থানা</label>
              <input value={form.thana} onChange={(e) => setForm((f) => ({ ...f, thana: e.target.value }))} className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          {error && <p className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">বাতিল</Button>
            <Button onClick={save} disabled={saving} className="flex-1">{saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">প্রোফাইল</h1>
        <Button size="sm" onClick={() => setEditing(true)} className="gap-1.5"><Edit2 className="h-3.5 w-3.5" /> সম্পাদনা</Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-teal-50 flex items-center justify-center text-xl font-bold text-teal-700">
            {(patient.nameBn ?? "?").charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-900">{patient.nameBn ?? "নাম দেওয়া হয়নি"}</p>
            <p className="text-xs text-gray-400">রোগী অ্যাকাউন্ট</p>
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5 text-gray-600">
            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
            {patient.user.email ?? "ইমেইল নেই"}
          </div>
          <div className="flex items-center gap-2.5 text-gray-600">
            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
            {patient.user.phone ?? "ফোন নম্বর দেওয়া হয়নি"}
          </div>
          {patient.bloodGroup && (
            <div className="flex items-center gap-2.5 text-gray-600">
              <Droplet className="h-4 w-4 text-gray-400 shrink-0" />
              রক্তের গ্রুপ: {patient.bloodGroup}
            </div>
          )}
          {(patient.address || patient.district) && (
            <div className="flex items-start gap-2.5 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{[patient.address, patient.thana, patient.district, patient.division].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      <Link href="/api/auth/signout" className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
        <LogOut className="h-4 w-4" /> লগ আউট
      </Link>
    </div>
  );
}
