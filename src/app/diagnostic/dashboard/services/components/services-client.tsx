"use client";

import { useState } from "react";
import {
  Plus,
  FlaskConical,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  centerId: string;
  nameEn: string;
  nameBn: string;
  category: string | null;
  price: number;
  discountPrice: number | null;
  duration: number | null;
  preparation: string | null;
  reportTime: string | null;
  isActive: boolean;
  sortOrder: number;
};

const CATEGORIES = [
  "রক্ত পরীক্ষা",
  "এক্স-রে",
  "আল্ট্রাসনোগ্রাম",
  "সিটি স্ক্যান",
  "এমআরআই",
  "ইসিজি",
  "ইকোকার্ডিওগ্রাম",
  "প্রস্রাব পরীক্ষা",
  "হরমোন পরীক্ষা",
  "অন্যান্য",
];

const emptyForm = {
  nameEn: "",
  nameBn: "",
  category: "",
  price: "",
  discountPrice: "",
  duration: "",
  preparation: "",
  reportTime: "",
};

export function ServicesClient({
  services: initialServices,
  centerId,
}: {
  services: Service[];
  centerId: string;
}) {
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = services.filter(
    (s) =>
      !search ||
      s.nameBn.includes(search) ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      (s.category ?? "").includes(search)
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      nameEn: s.nameEn,
      nameBn: s.nameBn,
      category: s.category ?? "",
      price: String(s.price),
      discountPrice: s.discountPrice != null ? String(s.discountPrice) : "",
      duration: s.duration != null ? String(s.duration) : "",
      preparation: s.preparation ?? "",
      reportTime: s.reportTime ?? "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.nameBn || !form.nameEn || !form.price) return;
    setSaving(true);
    try {
      const body = {
        centerId,
        nameEn: form.nameEn,
        nameBn: form.nameBn,
        category: form.category || null,
        price: parseInt(form.price),
        discountPrice: form.discountPrice ? parseInt(form.discountPrice) : null,
        duration: form.duration ? parseInt(form.duration) : null,
        preparation: form.preparation || null,
        reportTime: form.reportTime || null,
      };

      if (editingId) {
        const res = await fetch(`/api/diagnostic/services/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        }
      } else {
        const res = await fetch("/api/diagnostic/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          setServices((prev) => [...prev, created]);
        }
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const res = await fetch(`/api/diagnostic/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    if (res.ok) {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !currentActive } : s))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই সেবাটি মুছে ফেলতে চান?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/diagnostic/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">সেবা ও পরীক্ষাসমূহ</h1>
          <p className="text-sm text-gray-500 mt-0.5">{services.length} টি সেবা নিবন্ধিত</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          নতুন সেবা
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="সেবার নাম, বিভাগ খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Service form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">
                {editingId ? "সেবা সম্পাদনা" : "নতুন সেবা যোগ করুন"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    নাম (বাংলায়) *
                  </label>
                  <input
                    type="text"
                    value={form.nameBn}
                    onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))}
                    placeholder="রক্তের সম্পূর্ণ পরীক্ষা"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    placeholder="Complete Blood Count"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">বিভাগ</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">বিভাগ বাছুন</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">মূল্য (৳) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="500"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ছাড়ের মূল্য (৳)</label>
                  <input
                    type="number"
                    value={form.discountPrice}
                    onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                    placeholder="400"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    সময়কাল (মিনিট)
                  </label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="30"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">রিপোর্ট সময়</label>
                  <input
                    type="text"
                    value={form.reportTime}
                    onChange={(e) => setForm((f) => ({ ...f, reportTime: e.target.value }))}
                    placeholder="১ দিন / ৩ ঘণ্টা"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  প্রস্তুতি নির্দেশনা
                </label>
                <textarea
                  value={form.preparation}
                  onChange={(e) => setForm((f) => ({ ...f, preparation: e.target.value }))}
                  placeholder="পরীক্ষার আগে রোগীর কী করণীয়..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <Button variant="outline" onClick={closeForm} className="flex-1">
                বাতিল
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.nameBn || !form.nameEn || !form.price}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? "সংরক্ষণ হচ্ছে..." : editingId ? "আপডেট করুন" : "যোগ করুন"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Services list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <h3 className="font-semibold text-gray-600 mb-1">কোনো সেবা নেই</h3>
          <p className="text-sm text-gray-400 mb-5">প্রথম সেবা যোগ করুন</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            নতুন সেবা যোগ করুন
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                service.isActive ? "border-gray-100" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      service.isActive ? "bg-blue-50" : "bg-gray-50"
                    }`}
                  >
                    <FlaskConical
                      className={`h-5 w-5 ${service.isActive ? "text-blue-600" : "text-gray-400"}`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{service.nameBn}</p>
                    <p className="text-xs text-gray-400">{service.nameEn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleActive(service.id, service.isActive)}
                    className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                      service.isActive
                        ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                        : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {service.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                  </button>
                  <button
                    onClick={() => openEdit(service)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    disabled={deleting === service.id}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">
                  {service.discountPrice
                    ? `${formatCurrency(service.discountPrice)} (ছাড়)`
                    : formatCurrency(service.price)}
                </span>
                {service.category && (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    {service.category}
                  </span>
                )}
                {service.reportTime && (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    রিপোর্ট: {service.reportTime}
                  </span>
                )}
                {service.duration && (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    {service.duration} মিনিট
                  </span>
                )}
              </div>

              {service.preparation && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                  📋 {service.preparation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
