"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Stethoscope, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 mb-4">
            <Stethoscope className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            DOC<span className="text-teal-600">&amp;</span>TEST
          </h1>
          <p className="text-gray-500 mt-1 text-sm">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <Input
              label="ইমেইল"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />

            <Input
              label="পাসওয়ার্ড"
              type={showPass ? "text" : "password"}
              placeholder="পাসওয়ার্ড দিন"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
              rightIcon={
                <button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-gray-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-teal-600 hover:underline">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <Button type="submit" className="w-full h-12" loading={loading}>
              <LogIn className="h-4 w-4" />
              লগইন করুন
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            অ্যাকাউন্ট নেই?{" "}
            <Link href="/register" className="text-teal-600 font-medium hover:underline">
              রেজিস্ট্রেশন করুন
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 space-y-1">
          <p className="font-semibold">ডেমো লগইন:</p>
          <p>রোগী: patient@demo.com / demo1234</p>
          <p>ডাক্তার: doctor@demo.com / demo1234</p>
          <p>অ্যাডমিন: admin@demo.com / demo1234</p>
        </div>
      </div>
    </div>
  );
}
