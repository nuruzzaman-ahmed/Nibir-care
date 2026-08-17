"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FlaskConical,
  Users,
  LogOut,
  Building2,
  User,
  CreditCard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/diagnostic/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { href: "/diagnostic/dashboard/bookings", label: "টেস্ট বুকিং", icon: CalendarDays },
  { href: "/diagnostic/dashboard/services", label: "সেবা ও পরীক্ষা", icon: FlaskConical },
  { href: "/diagnostic/dashboard/doctors", label: "ডাক্তারগণ", icon: Users },
  { href: "/diagnostic/dashboard/profile", label: "প্রোফাইল", icon: User },
  { href: "/diagnostic/dashboard/billing", label: "বিলিং", icon: CreditCard },
];

export function DiagnosticSidebar({
  user,
  centerName,
}: {
  user: { name?: string | null; image?: string | null; email?: string | null };
  centerName?: string;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-40 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-50">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">
              DOC<span className="text-blue-600">&amp;</span>TEST
            </span>
          </Link>
        </div>

        {/* Center info */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="bg-blue-50 text-blue-700">
                {(centerName ?? user.name)?.charAt(0) ?? "D"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {centerName ?? user.name}
              </p>
              <p className="text-xs text-blue-600 font-medium">ডায়াগনস্টিক সেন্টার</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
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
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">DOC&amp;TEST</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            ডায়াগনস্টিক
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
              {(centerName ?? user.name)?.charAt(0) ?? "D"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-400"
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </div>
    </>
  );
}
