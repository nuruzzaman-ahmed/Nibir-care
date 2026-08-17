"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Log = {
  id: string;
  action: string;
  adminNote: string | null;
  createdAt: Date;
};

const actionLabel: Record<string, string> = {
  SUBMITTED: "জমা দেওয়া হয়েছে",
  UNDER_REVIEW: "পর্যালোচনা শুরু",
  VERIFIED: "যাচাই করা হয়েছে",
  REJECTED: "প্রত্যাখ্যান করা হয়েছে",
  SUSPENDED: "স্থগিত করা হয়েছে",
};

export function VerifyEntityClient({
  entityId,
  entityType,
  name,
  currentStatus,
  defaultAction,
  fields,
  logs,
}: {
  entityId: string;
  entityType: "DOCTOR" | "DIAGNOSTIC";
  name: string;
  currentStatus: string;
  defaultAction: "verify" | "reject";
  fields: { label: string; value: string }[];
  logs: Log[];
}) {
  const router = useRouter();
  const [action, setAction] = useState<"verify" | "reject" | "suspend">(defaultAction);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const actionMap = { verify: "VERIFY", reject: "REJECT", suspend: "SUSPEND" };
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          action: actionMap[action],
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "কিছু সমস্যা হয়েছে");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/admin"), 1800);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "VERIFIED") return "success";
    if (s === "PENDING") return "warning";
    if (s === "UNDER_REVIEW") return "info";
    return "destructive";
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">সম্পন্ন হয়েছে!</h2>
          <p className="text-gray-500 text-sm">অ্যাডমিন প্যানেলে ফিরে যাচ্ছি...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {entityType === "DOCTOR" ? "ডাক্তার" : "ডায়াগনস্টিক"} যাচাই
            </h1>
            <p className="text-xs text-gray-400">{name}</p>
          </div>
          <Badge
            variant={statusColor(currentStatus) as "warning" | "info" | "success" | "destructive"}
            className="ml-auto"
          >
            {currentStatus === "PENDING"
              ? "অপেক্ষারত"
              : currentStatus === "UNDER_REVIEW"
              ? "পর্যালোচনা"
              : currentStatus === "VERIFIED"
              ? "যাচাইকৃত"
              : currentStatus === "REJECTED"
              ? "প্রত্যাখ্যাত"
              : currentStatus}
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              নিবন্ধিত তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {fields.map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">সিদ্ধান্ত নিন</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["verify", "reject", "suspend"] as const).map((a) => {
                const meta = {
                  verify: { label: "যাচাই করুন", icon: CheckCircle2, active: "bg-emerald-600 text-white", inactive: "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300" },
                  reject: { label: "প্রত্যাখ্যান", icon: XCircle, active: "bg-red-500 text-white", inactive: "bg-white text-gray-600 border border-gray-200 hover:border-red-300" },
                  suspend: { label: "স্থগিত", icon: AlertCircle, active: "bg-amber-500 text-white", inactive: "bg-white text-gray-600 border border-gray-200 hover:border-amber-300" },
                }[a];
                const Icon = meta.icon;
                return (
                  <button
                    key={a}
                    onClick={() => setAction(a)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all ${action === a ? meta.active : meta.inactive}`}
                  >
                    <Icon className="h-5 w-5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                মন্তব্য {action === "reject" ? "(বাধ্যতামূলক)" : "(ঐচ্ছিক)"}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder={
                  action === "verify"
                    ? "যাচাই সম্পর্কিত কোনো মন্তব্য..."
                    : action === "reject"
                    ? "প্রত্যাখ্যানের কারণ লিখুন..."
                    : "স্থগিত করার কারণ..."
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin")}
                className="flex-1"
              >
                বাতিল
              </Button>
              <Button
                variant={action === "verify" ? "success" : action === "reject" ? "destructive" : "warning"}
                onClick={handleSubmit}
                disabled={submitting || (action === "reject" && !note)}
                loading={submitting}
                className="flex-1"
              >
                {action === "verify" ? "যাচাই নিশ্চিত করুন" : action === "reject" ? "প্রত্যাখ্যান নিশ্চিত করুন" : "স্থগিত নিশ্চিত করুন"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit log */}
        {logs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                অতীত কার্যক্রম
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {actionLabel[log.action] ?? log.action}
                      </p>
                      {log.adminNote && (
                        <p className="text-xs text-gray-400 mt-0.5">{log.adminNote}</p>
                      )}
                      <p className="text-[10px] text-gray-300 mt-0.5">
                        {new Date(log.createdAt).toLocaleString("bn-BD")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
