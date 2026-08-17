"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIG, type PlanKey } from "@/lib/subscription";

export function SubscriptionGate({
  active,
  expiredPlan,
  billingHref,
  accent = "teal",
  children,
}: {
  active: boolean;
  expiredPlan: string | null;
  billingHref: string;
  accent?: "teal" | "blue";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBillingPage = pathname === billingHref;

  if (active || isBillingPage) return <>{children}</>;

  const accentCls = accent === "blue" ? "bg-blue-600 hover:bg-blue-700" : "bg-teal-600 hover:bg-teal-700";

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="max-w-sm w-full text-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {expiredPlan ? `আপনার ${PLAN_CONFIG[expiredPlan as PlanKey]?.label ?? expiredPlan} প্ল্যানের মেয়াদ শেষ হয়েছে` : "কোনো সক্রিয় প্ল্যান নেই"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          ড্যাশবোর্ড ব্যবহার চালিয়ে যেতে একটি প্ল্যান বেছে নিন। আপনার সব ডেটা নিরাপদে সংরক্ষিত আছে।
        </p>
        <Link href={billingHref}>
          <Button className={`w-full ${accentCls}`}>প্ল্যান বেছে নিন</Button>
        </Link>
      </div>
    </div>
  );
}
