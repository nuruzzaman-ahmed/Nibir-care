"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  FlaskConical,
  Users,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "ওভারভিউ", icon: LayoutDashboard, exact: true },
  { href: "/admin/doctors", label: "ডাক্তার", icon: Stethoscope },
  { href: "/admin/centers", label: "ডায়াগনস্টিক", icon: FlaskConical },
  { href: "/admin/users", label: "ব্যবহারকারী", icon: Users },
];

export function AdminSidebar({ user }: { user: { name?: string | null; image?: string | null; email?: string | null } }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-950 border-r border-gray-900 z-40 hidden lg:flex flex-col">
        <div className="p-5 border-b border-gray-900">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">
              DOC<span className="text-teal-500">&amp;</span>TEST
            </span>
          </Link>
        </div>

        <div className="p-4 border-b border-gray-900">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image ?? ""} />
              <AvatarFallback className="bg-teal-900 text-teal-300">{user.name?.charAt(0) ?? "A"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-teal-500 font-medium">অ্যাডমিন</p>
            </div>
          </div>
        </div>

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
                    isActive ? "bg-teal-600/15 text-teal-400" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-gray-900">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            লগ আউট
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-950 border-b border-gray-900 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-white">DOC&amp;TEST অ্যাডমিন</span>
        </Link>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image ?? ""} />
          <AvatarFallback className="text-xs bg-teal-900 text-teal-300">{user.name?.charAt(0) ?? "A"}</AvatarFallback>
        </Avatar>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-900 flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-teal-400" : "text-gray-500"
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
