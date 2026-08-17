"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Stethoscope, FlaskConical, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "হোম", icon: Home, exact: true },
  { href: "/doctors", label: "ডাক্তার", icon: Stethoscope },
  { href: "/tests", label: "টেস্ট", icon: FlaskConical },
  { href: "/notifications", label: "নোটিশ", icon: Bell },
  { href: "/profile", label: "প্রোফাইল", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/98 backdrop-blur-md border-t border-gray-100 shadow-[0_-1px_0_0_#f0f0f0,0_-4px_12px_0_rgba(0,0,0,.05)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-stretch h-[58px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 relative"
            >
              <div className={cn(
                "relative flex items-center justify-center w-11 h-7 rounded-2xl transition-all duration-200",
                isActive ? "bg-teal-600" : "bg-transparent"
              )}>
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-all",
                    isActive ? "text-white" : "text-gray-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium leading-none transition-colors",
                isActive ? "text-teal-600" : "text-gray-400"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
