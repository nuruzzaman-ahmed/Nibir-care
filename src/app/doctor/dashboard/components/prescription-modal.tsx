"use client";

import { useState, useRef, useCallback } from "react";
import {
  X, Plus, Trash2, Search, FileText, Pill, Stethoscope, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Medicine = {
  id: string;
  nameEn: string;
  nameBn: string | null;
  genericName: string;
  type: string;
  strength: string | null;
};

type RxItem = {
  key: string;
  medicineName: string;
  medicineId?: string;
  dosage: string;
  duration: string;
  timing: string;
  quantity: string;
  instructions: string;
};

type Props = {
  appointmentId: string;
  patientName: string;
  serialNumber: number;
  onClose: () => void;
  onSaved?: () => void;
};

const TIMING_OPTIONS = [
  "খাবার পরে",
  "খাবার আগে",
  "খালি পেটে",
  "রাতে ঘুমানোর আগে",
  "সকালে খালি পেটে",
  "দুপুরে খাবার পরে",
  "প্রয়োজনে",
];

const DOSAGE_PRESETS = ["1+0+0", "0+0+1", "1+1+1", "1+0+1", "0+1+0", "1+1+0", "0+0+0+1"];
const DURATION_PRESETS = ["৩ দিন", "৫ দিন", "৭ দিন", "১০ দিন", "১৪ দিন", "১ মাস", "চলমান"];

const newItem = (): RxItem => ({
  key: crypto.randomUUID(),
  medicineName: "",
  medicineId: undefined,
  dosage: "1+0+1",
  duration: "৭ দিন",
  timing: "খাবার পরে",
  quantity: "",
  instructions: "",
});

export function PrescriptionModal({ appointmentId, patientName, serialNumber, onClose, onSaved }: Props) {
  const [items, setItems] = useState<RxItem[]>([newItem()]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [followUpDays, setFollowUpDays] = useState("");
  const [weight, setWeight] = useState("");
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");
  const [pulse, setPulse] = useState("");

  // Medicine search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [searchingFor, setSearchingFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const searchMedicines = useCallback(async (q: string, itemKey: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchingFor(itemKey);
    const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setSearchResults(await res.json());
  }, []);

  const updateItem = (key: string, patch: Partial<RxItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const selectMedicine = (item: RxItem, med: Medicine) => {
    updateItem(item.key, {
      medicineName: med.nameEn + (med.strength ? ` ${med.strength}` : ""),
      medicineId: med.id,
    });
    setSearchResults([]);
    setSearchingFor(null);
  };

  const handleSave = async () => {
    const validItems = items.filter((it) => it.medicineName.trim());
    setSaving(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          chiefComplaint: chiefComplaint || undefined,
          diagnosis: diagnosis || undefined,
          advice: advice ? advice.split("\n").filter(Boolean) : undefined,
          followUpDays: followUpDays ? parseInt(followUpDays) : undefined,
          weight: weight || undefined,
          bloodPressure: bp || undefined,
          temperature: temp || undefined,
          pulse: pulse || undefined,
          items: validItems.map((it, i) => ({
            medicineName: it.medicineName,
            medicineId: it.medicineId,
            dosage: it.dosage,
            duration: it.duration,
            timing: it.timing,
            quantity: it.quantity || undefined,
            instructions: it.instructions || undefined,
            sortOrder: i,
          })),
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved?.();
        setTimeout(onClose, 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-4 px-2">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-teal-50 rounded-xl flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-[15px]">প্রেসক্রিপশন</h2>
              <p className="text-[12px] text-gray-400">
                সিরিয়াল #{serialNumber} — {patientName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Vitals */}
          <div>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">ভাইটাল সাইন</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "ওজন (কেজি)", value: weight, set: setWeight, placeholder: "৬৫" },
                { label: "রক্তচাপ", value: bp, set: setBp, placeholder: "১২০/৮০" },
                { label: "তাপমাত্রা", value: temp, set: setTemp, placeholder: "৯৮.৬°F" },
                { label: "পালস", value: pulse, set: setPulse, placeholder: "৭২/মিনিট" },
              ].map((v) => (
                <div key={v.label}>
                  <label className="block text-[11px] text-gray-400 mb-1">{v.label}</label>
                  <input
                    type="text"
                    value={v.value}
                    onChange={(e) => v.set(e.target.value)}
                    placeholder={v.placeholder}
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Chief Complaint & Diagnosis */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">
                <Stethoscope className="inline h-3 w-3 mr-1" />
                প্রধান সমস্যা
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="রোগীর প্রধান অভিযোগ..."
                rows={2}
                className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">রোগ নির্ণয়</label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Diagnosis..."
                rows={2}
                className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5" /> ওষুধের তালিকা
              </p>
              <button
                onClick={() => setItems((p) => [...p, newItem()])}
                className="flex items-center gap-1 text-[12px] font-semibold text-teal-600 hover:text-teal-700"
              >
                <Plus className="h-3.5 w-3.5" /> ওষুধ যোগ করুন
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.key} className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="h-6 w-6 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>

                    {/* Medicine name with search */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={item.medicineName}
                        onChange={(e) => {
                          updateItem(item.key, { medicineName: e.target.value, medicineId: undefined });
                          clearTimeout(searchTimeout.current);
                          searchTimeout.current = setTimeout(() => searchMedicines(e.target.value, item.key), 250);
                        }}
                        placeholder="ওষুধের নাম লিখুন বা খুঁজুন..."
                        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                      {/* Autocomplete */}
                      {searchingFor === item.key && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-30 overflow-hidden">
                          {searchResults.map((med) => (
                            <button
                              key={med.id}
                              onClick={() => selectMedicine(item, med)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 text-left transition-colors"
                            >
                              <Pill className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                              <div>
                                <p className="text-[13px] font-semibold text-gray-900">
                                  {med.nameEn}{med.strength ? ` ${med.strength}` : ""}
                                </p>
                                <p className="text-[11px] text-gray-400">{med.genericName} · {med.type}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setItems((p) => p.filter((it) => it.key !== item.key))}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-8">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">মাত্রা</label>
                      <select
                        value={item.dosage}
                        onChange={(e) => updateItem(item.key, { dosage: e.target.value })}
                        className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        {DOSAGE_PRESETS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">সময়কাল</label>
                      <select
                        value={item.duration}
                        onChange={(e) => updateItem(item.key, { duration: e.target.value })}
                        className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        {DURATION_PRESETS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">সেবনের সময়</label>
                      <select
                        value={item.timing}
                        onChange={(e) => updateItem(item.key, { timing: e.target.value })}
                        className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        {TIMING_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-1">পরিমাণ</label>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                        placeholder="১৪টি"
                        className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="ml-8 mt-2">
                    <input
                      type="text"
                      value={item.instructions}
                      onChange={(e) => updateItem(item.key, { instructions: e.target.value })}
                      placeholder="বিশেষ নির্দেশনা (ঐচ্ছিক)..."
                      className="w-full px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">পরামর্শ</label>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="প্রতিটি পরামর্শ এক লাইনে লিখুন..."
                rows={3}
                className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">পুনরায় দেখা (দিনের মধ্যে)</label>
              <input
                type="number"
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value)}
                placeholder="যেমন: ৭"
                className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">রোগী ড্যাশবোর্ডে ফলো-আপ রিমাইন্ডার পাবেন</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <p className="text-[12px] text-gray-400">
            {items.filter((i) => i.medicineName).length} টি ওষুধ
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-9">বাতিল</Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700"
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saved ? (
                "✓ সংরক্ষিত!"
              ) : saving ? (
                "সংরক্ষণ হচ্ছে..."
              ) : (
                <><Save className="h-3.5 w-3.5" /> প্রেসক্রিপশন সংরক্ষণ</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
