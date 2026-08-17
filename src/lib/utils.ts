import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("bn-BD")}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDayName(day: number, lang: "en" | "bn" = "bn"): string {
  const enDays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
  const enDaysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return lang === "bn" ? enDays[day] : enDaysEn[day];
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

export function minutesToDisplay(minutes: number): string {
  if (minutes < 60) return `${minutes} মিনিট`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} ঘণ্টা`;
  return `${hours} ঘণ্টা ${mins} মিনিট`;
}

export function getVerificationBadge(status: string): {
  label: string;
  color: string;
} {
  const map: Record<string, { label: string; color: string }> = {
    VERIFIED: { label: "যাচাইকৃত", color: "text-emerald-600 bg-emerald-50" },
    PENDING: { label: "অপেক্ষারত", color: "text-amber-600 bg-amber-50" },
    UNDER_REVIEW: { label: "পর্যালোচনাধীন", color: "text-blue-600 bg-blue-50" },
    REJECTED: { label: "প্রত্যাখ্যাত", color: "text-red-600 bg-red-50" },
    SUSPENDED: { label: "স্থগিত", color: "text-gray-600 bg-gray-50" },
  };
  return map[status] ?? { label: status, color: "text-gray-600 bg-gray-50" };
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    BOOKED: "বুক হয়েছে",
    WAITING: "অপেক্ষারত",
    CURRENT: "চলমান",
    COMPLETED: "সম্পন্ন",
    SKIPPED: "বাদ",
    NO_SHOW: "অনুপস্থিত",
    CANCELLED: "বাতিল",
    NOT_STARTED: "শুরু হয়নি",
    RUNNING: "চলছে",
    PAUSED: "বিরতি",
  };
  return map[status] ?? status;
}
