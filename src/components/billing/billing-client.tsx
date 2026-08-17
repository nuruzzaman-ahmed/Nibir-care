"use client";

import { useState } from "react";
import { CheckCircle2, Crown, Sparkles, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { PLAN_CONFIG, type PlanKey } from "@/lib/subscription";

type CurrentSub = {
  plan: string;
  status: string;
  endsAt: string;
  isActive: boolean;
  daysLeft: number;
};

const PLAN_ICON: Record<PlanKey, React.ElementType> = {
  FREE: Sparkles,
  PRO: Crown,
  BUSINESS: ShieldCheck,
};

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  FREE: ["সম্পূর্ণ ফিচার ব্যবহার", "লাইভ কিউ ম্যানেজমেন্ট", "১ মাসের জন্য ফ্রি", "কোনো কার্ড লাগবে না"],
  PRO: ["সব ফ্রি ফিচার", "অগ্রাধিকার সাপোর্ট", "প্রতি মাসে নবায়ন", "যেকোনো সময় বাতিল করুন"],
  BUSINESS: ["সব প্রো ফিচার", "১ বছরের সাশ্রয়ী মূল্য", "ডেডিকেটেড সাপোর্ট", "অগ্রাধিকার তালিকাভুক্তি"],
};

const PLAN_COLOR: Record<PlanKey, string> = {
  FREE: "border-gray-200",
  PRO: "border-teal-400 ring-2 ring-teal-100",
  BUSINESS: "border-purple-400 ring-2 ring-purple-100",
};

export function BillingClient({ current }: { current: CurrentSub | null }) {
  const [activating, setActivating] = useState<PlanKey | null>(null);
  const [sub, setSub] = useState(current);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const activate = async (plan: PlanKey) => {
    setActivating(plan);
    setMessage("");
    setMessageIsError(false);
    try {
      const res = await fetch("/api/subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok) {
        const endsAt = new Date(data.endsAt);
        const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000));
        setSub({ plan: data.plan, status: data.status, endsAt: data.endsAt, isActive: true, daysLeft });
        setMessage(`"${PLAN_CONFIG[plan].label}" প্ল্যান সক্রিয় করা হয়েছে!`);
      } else {
        setMessageIsError(true);
        setMessage(data.error ?? "প্ল্যান সক্রিয় করা যায়নি, আবার চেষ্টা করুন");
      }
    } catch {
      setMessageIsError(true);
      setMessage("সংযোগ সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">বিলিং ও সাবস্ক্রিপশন</h1>
        <p className="text-sm text-gray-500 mt-0.5">আপনার প্ল্যান পরিচালনা করুন</p>
      </div>

      {/* Current status banner */}
      <div
        className={cn(
          "rounded-2xl p-4 mb-6 flex items-center gap-3 border",
          sub?.isActive ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
        )}
      >
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", sub?.isActive ? "bg-emerald-100" : "bg-red-100")}>
          <Clock className={cn("h-5 w-5", sub?.isActive ? "text-emerald-600" : "text-red-600")} />
        </div>
        <div>
          {sub?.isActive ? (
            <>
              <p className="text-sm font-semibold text-emerald-800">
                বর্তমান প্ল্যান: {PLAN_CONFIG[sub.plan as PlanKey]?.label ?? sub.plan} — {sub.daysLeft} দিন বাকি
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">মেয়াদ শেষ: {new Date(sub.endsAt).toLocaleDateString("bn-BD")}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-red-800">
                {sub ? "আপনার প্ল্যানের মেয়াদ শেষ হয়েছে" : "কোনো সক্রিয় প্ল্যান নেই"}
              </p>
              <p className="text-xs text-red-600 mt-0.5">ড্যাশবোর্ড ব্যবহার চালিয়ে যেতে একটি প্ল্যান বেছে নিন</p>
            </>
          )}
        </div>
      </div>

      {message && (
        <div
          className={cn(
            "mb-6 rounded-xl px-4 py-3 text-sm font-medium border",
            messageIsError ? "bg-red-50 border-red-100 text-red-700" : "bg-teal-50 border-teal-100 text-teal-700"
          )}
        >
          {messageIsError ? "⚠" : "✓"} {message}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(PLAN_CONFIG) as PlanKey[]).map((key) => {
          const config = PLAN_CONFIG[key];
          const Icon = PLAN_ICON[key];
          const isCurrent = sub?.plan === key && sub?.isActive;
          const isActivating = activating === key;
          return (
            <div
              key={key}
              className={cn(
                "bg-white rounded-2xl border-2 p-5 flex flex-col shadow-sm relative",
                PLAN_COLOR[key]
              )}
            >
              {key === "PRO" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  জনপ্রিয়
                </span>
              )}
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3", key === "FREE" ? "bg-gray-50 text-gray-500" : key === "PRO" ? "bg-teal-50 text-teal-600" : "bg-purple-50 text-purple-600")}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{config.label}</h3>
              <p className="text-xs text-gray-400 mb-3">{config.tagline}</p>
              <div className="mb-4">
                <span className="text-2xl font-extrabold text-gray-900">{config.price === 0 ? "ফ্রি" : formatCurrency(config.price)}</span>
                {config.price > 0 && (
                  <span className="text-xs text-gray-400 ml-1">/ {config.durationDays >= 365 ? "বছর" : "মাস"}</span>
                )}
              </div>
              <ul className="space-y-2 mb-5 flex-1">
                {PLAN_FEATURES[key].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => activate(key)}
                disabled={isActivating || isCurrent}
                className={cn(
                  "w-full",
                  isCurrent ? "bg-gray-100 text-gray-400 hover:bg-gray-100" : key === "PRO" ? "bg-teal-600 hover:bg-teal-700" : key === "BUSINESS" ? "bg-purple-600 hover:bg-purple-700" : ""
                )}
                variant={key === "FREE" && !isCurrent ? "outline" : "default"}
              >
                {isCurrent ? "বর্তমান প্ল্যান" : isActivating ? "সক্রিয় হচ্ছে..." : "বেছে নিন"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-6">
        💳 এখনো সরাসরি পেমেন্ট গেটওয়ে (bKash/Nagad) যুক্ত হয়নি — প্ল্যান বেছে নিলে সাথে সাথেই সক্রিয় হয়ে যাবে (ডেমো মোড)।
      </p>
    </div>
  );
}
