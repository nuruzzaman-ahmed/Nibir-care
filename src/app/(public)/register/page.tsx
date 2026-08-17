"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Stethoscope, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = "PATIENT" | "DOCTOR" | "DIAGNOSTIC";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("PATIENT");
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "রেজিস্ট্রেশন ব্যর্থ হয়েছে");
        setLoading(false);
        return;
      }

      // Auto-login
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      const redirectMap: Record<Role, string> = {
        PATIENT: "/dashboard",
        DOCTOR: "/doctor/dashboard",
        DIAGNOSTIC: "/diagnostic/dashboard",
      };

      router.push(redirectMap[role]);
    } catch {
      setError("একটি সমস্যা হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 mb-4">
            <Stethoscope className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            DOC<span className="text-teal-600">&amp;</span>TEST
          </h1>
          <p className="text-gray-500 mt-1 text-sm">নতুন অ্যাকাউন্ট তৈরি করুন</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">আমি একজন...</p>
            <div className="grid grid-cols-3 gap-2">
              {(["PATIENT", "DOCTOR", "DIAGNOSTIC"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    role === r
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  {r === "PATIENT" ? "👤 রোগী" : r === "DOCTOR" ? "🩺 ডাক্তার" : "🏥 ডায়াগনস্টিক"}
                </button>
              ))}
            </div>
            {(role === "DOCTOR" || role === "DIAGNOSTIC") && (
              <p className="mt-3 text-xs text-teal-700 bg-teal-50 rounded-xl px-3 py-2">
                🎁 ১ মাস ফ্রি ট্রায়াল দিয়ে শুরু করুন — কোনো কার্ড লাগবে না।
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <Input
              label="মোবাইল নম্বর"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
              minLength={11}
            />

            <Input
              label="ইমেইল"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />

            <Input
              label="পাসওয়ার্ড"
              type={showPass ? "text" : "password"}
              placeholder="কমপক্ষে ৮ অক্ষর"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              rightIcon={
                <button type="button" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Button type="submit" className="w-full h-12" loading={loading}>
              <UserPlus className="h-4 w-4" />
              রেজিস্ট্রেশন করুন
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
            <Link href="/login" className="text-teal-600 font-medium hover:underline">
              লগইন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
