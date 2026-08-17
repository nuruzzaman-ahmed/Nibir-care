export type PlanKey = "FREE" | "PRO" | "BUSINESS";

export const PLAN_CONFIG: Record<PlanKey, { label: string; price: number; durationDays: number; tagline: string }> = {
  FREE: { label: "ফ্রি ট্রায়াল", price: 0, durationDays: 30, tagline: "১ মাস বিনামূল্যে ব্যবহার করুন" },
  PRO: { label: "প্রো", price: 999, durationDays: 30, tagline: "প্রতি মাসে নবায়নযোগ্য" },
  BUSINESS: { label: "বিজনেস", price: 9999, durationDays: 365, tagline: "১ বছরের জন্য, সাশ্রয়ী মূল্যে" },
};

export type SubscriptionLike = {
  status: string;
  endsAt: Date;
} | null | undefined;

export function isSubscriptionActive(sub: SubscriptionLike): boolean {
  if (!sub) return false;
  if (sub.status === "CANCELLED") return false;
  return sub.endsAt.getTime() > Date.now();
}

export function subscriptionDaysLeft(sub: SubscriptionLike): number {
  if (!sub) return 0;
  return Math.max(0, Math.ceil((sub.endsAt.getTime() - Date.now()) / 86400000));
}

export function activePlanFilter(now: Date = new Date()) {
  return { endsAt: { gt: now }, status: { not: "CANCELLED" } };
}
