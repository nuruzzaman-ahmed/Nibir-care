"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  LogOut,
  Stethoscope,
  MapPin,
  User,
  CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/doctor/dashboard", label: "লাইভ কিউ", icon: LayoutDashboard, exact: true },
  { href: "/doctor/dashboard/appointments", label: "অ্যাপয়েন্টমেন্ট", icon: CalendarDays },
  { href: "/doctor/dashboard/chambers", label: "চেম্বার", icon: MapPin },
  { href: "/doctor/dashboard/profile", label: "প্রোফাইল", icon: User },
  { href: "/doctor/dashboard/billing", label: "বিলিং", icon: CreditCard },
];

export function DoctorSidebar({ user }: { user: { name?: string | null; image?: string | null; email?: string | null } }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-40 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-50">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">
              DOC<span className="text-teal-600">&amp;</span>TEST
            </span>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback>{user.name?.charAt(0) ?? "D"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-teal-600 font-medium">ডাক্তার</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-50">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            লগ আউট
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <Stethoscope className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">DOC&amp;TEST</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
            ডাক্তার
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xs">{user.name?.charAt(0) ?? "D"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </>
  );
}
