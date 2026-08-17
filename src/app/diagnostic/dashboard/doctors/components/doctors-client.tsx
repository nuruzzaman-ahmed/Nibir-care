"use client";

import { useState } from "react";
import { Users, Plus, X, Search, Stethoscope, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Doctor = {
  id: string;
  nameBn: string;
  nameEn: string;
  consultationFee: number;
  photo: string | null;
  specialties: {
    specialty: { nameBn: string };
    isPrimary: boolean;
  }[];
};

type LinkedDoctor = {
  id: string;
  centerId: string;
  doctorId: string;
  isActive: boolean;
  addedAt: Date;
  doctor: Doctor;
};

export function DoctorsClient({
  linkedDoctors: initialLinked,
  availableDoctors: initialAvailable,
  centerId,
}: {
  linkedDoctors: LinkedDoctor[];
  availableDoctors: Doctor[];
  centerId: string;
}) {
  const [linked, setLinked] = useState(initialLinked);
  const [available, setAvailable] = useState(initialAvailable);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const filteredAvailable = available.filter(
    (d) =>
      !search ||
      d.nameBn.includes(search) ||
      d.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      d.specialties.some((s) => s.specialty.nameBn.includes(search))
  );

  const handleAdd = async (doctor: Doctor) => {
    setAdding(doctor.id);
    try {
      const res = await fetch("/api/diagnostic/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId, doctorId: doctor.id }),
      });
      if (res.ok) {
        const newLink = await res.json();
        setLinked((prev) => [{ ...newLink, doctor }, ...prev]);
        setAvailable((prev) => prev.filter((d) => d.id !== doctor.id));
        setShowSearch(false);
        setSearch("");
      }
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (linkId: string, doctorId: string) => {
    if (!confirm("এই ডাক্তারকে কেন্দ্র থেকে সরাতে চান?")) return;
    setRemoving(linkId);
    try {
      const res = await fetch(`/api/diagnostic/doctors/${linkId}`, { method: "DELETE" });
      if (res.ok) {
        const removedDoctor = linked.find((l) => l.id === linkId)?.doctor;
        setLinked((prev) => prev.filter((l) => l.id !== linkId));
        if (removedDoctor) {
          setAvailable((prev) => [removedDoctor, ...prev]);
        }
      }
    } finally {
      setRemoving(null);
    }
  };

  const handleToggleActive = async (linkId: string, currentActive: boolean) => {
    const res = await fetch(`/api/diagnostic/doctors/${linkId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    if (res.ok) {
      setLinked((prev) =>
        prev.map((l) => (l.id === linkId ? { ...l, isActive: !currentActive } : l))
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ডাক্তারগণ</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {linked.length} জন ডাক্তার এই কেন্দ্রে আছেন
          </p>
        </div>
        <Button
          onClick={() => setShowSearch(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          ডাক্তার যোগ
        </Button>
      </div>

      {/* Add doctor modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">ডাক্তার যোগ করুন</h2>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearch("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ডাক্তারের নাম, বিশেষত্ব..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredAvailable.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {search ? "কোনো ডাক্তার পাওয়া যায়নি" : "সব যাচাইকৃত ডাক্তার ইতিমধ্যে যোগ করা হয়েছে"}
                </div>
              ) : (
                filteredAvailable.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-teal-50 text-teal-700 text-sm">
                        {doctor.nameBn.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doctor.nameBn}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {doctor.specialties[0]?.specialty.nameBn ?? "সাধারণ চিকিৎসক"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAdd(doctor)}
                      disabled={adding === doctor.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      {adding === doctor.id ? "..." : "যোগ করুন"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Linked doctors list */}
      {linked.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো ডাক্তার যোগ করা হয়নি</h3>
          <p className="text-sm text-gray-400 mb-5">
            যাচাইকৃত ডাক্তারদের এই কেন্দ্রে যোগ করুন
          </p>
          <Button onClick={() => setShowSearch(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            ডাক্তার যোগ করুন
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {linked.map((link) => {
            const doctor = link.doctor;
            const specialty = doctor.specialties[0]?.specialty.nameBn ?? "সাধারণ চিকিৎসক";
            return (
              <div
                key={link.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                  link.isActive ? "border-gray-100" : "border-gray-100 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-teal-50 text-teal-700">
                      {doctor.nameBn.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{doctor.nameBn}</p>
                    <p className="text-xs text-teal-600">{specialty}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ভিজিট: {formatCurrency(doctor.consultationFee)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggleActive(link.id, link.isActive)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                        link.isActive
                          ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {link.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </button>
                    <button
                      onClick={() => handleRemove(link.id, doctor.id)}
                      disabled={removing === link.id}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
