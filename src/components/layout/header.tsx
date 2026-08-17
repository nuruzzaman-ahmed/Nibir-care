"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  X,
  Stethoscope,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  FileText,
  Stethoscope as DoctorIcon,
  FlaskConical,
  User as UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type HeaderProps = {
  user?: { id: string; name?: string | null; email?: string | null; image?: string | null; role: string } | null;
  notificationCount?: number;
};

const navLinks = [
  { href: "/doctors", label: "ডাক্তার", icon: DoctorIcon },
  { href: "/diagnostic-centers", label: "ডায়াগনস্টিক", icon: FlaskConical },
];

const dashboardHref = (role: string) =>
  role === "DOCTOR" ? "/doctor/dashboard" :
  role === "DIAGNOSTIC" ? "/diagnostic/dashboard" :
  role === "ADMIN" ? "/admin" : "/dashboard";

const roleLabel = (role: string) =>
  role === "DOCTOR" ? "ডাক্তার" :
  role === "DIAGNOSTIC" ? "ডায়াগনস্টিক সেন্টার" :
  role === "ADMIN" ? "অ্যাডমিন" : "রোগী";

export function Header({ user, notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Lock body scroll while the offcanvas is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Close offcanvas on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-[0_1px_3px_0_rgba(16,24,40,.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-5">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Stethoscope className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-[16px] tracking-tight text-gray-900">
              DOC<span className="text-teal-600">&amp;</span>TEST
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                  pathname.startsWith(l.href)
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5">

            {/* Desktop-only: notifications + profile dropdown */}
            <div className="hidden lg:flex items-center gap-1.5">
              {user && (
                <Link
                  href="/notifications"
                  className="relative h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  {notificationCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.image ?? ""} />
                      <AvatarFallback className="text-[10px] font-semibold bg-teal-50 text-teal-700">
                        {user.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className={cn("h-3 w-3 text-gray-400 transition-transform", profileOpen && "rotate-180")} />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-white border border-gray-100 shadow-lg z-20 overflow-hidden animate-slide-down">
                        <div className="px-3.5 py-3 border-b border-gray-50">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="p-1">
                          <Link
                            href={dashboardHref(user.role)}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                          >
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            ড্যাশবোর্ড
                          </Link>
                          {user.role === "PATIENT" && (
                            <Link
                              href="/my/prescriptions"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              প্রেসক্রিপশন
                            </Link>
                          )}
                        </div>
                        <div className="p-1 border-t border-gray-50">
                          <Link
                            href="/api/auth/signout"
                            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            লগ আউট
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    লগইন
                  </Link>
                  <Link
                    href="/register"
                    className="px-3.5 py-1.5 text-[13px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                  >
                    রেজিস্টার
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger — opens offcanvas menu */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="মেনু খুলুন"
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile offcanvas ── */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-[60] transition-opacity duration-300",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
        />

        {/* Panel */}
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[82%] max-w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Header of panel */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
            <span className="font-heading font-bold text-[15px] text-gray-900">মেনু</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="মেনু বন্ধ করুন"
              className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Profile section */}
            {user ? (
              <Link
                href={dashboardHref(user.role)}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-teal-50/60 to-white active:bg-teal-50 transition-colors"
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={user.image ?? ""} />
                  <AvatarFallback className="text-sm font-bold bg-teal-100 text-teal-700">
                    {user.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-teal-600 font-medium mt-0.5">{roleLabel(user.role)}</p>
                </div>
                <LayoutDashboard className="h-4 w-4 text-gray-300 shrink-0" />
              </Link>
            ) : (
              <div className="px-4 py-4 border-b border-gray-100 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 text-[13px] font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors"
                >
                  রেজিস্টার
                </Link>
              </div>
            )}

            {/* Nav links */}
            <nav className="p-3 space-y-0.5">
              {navLinks.map((l) => {
                const Icon = l.icon;
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors",
                      active ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    {l.label}
                  </Link>
                );
              })}

              {user && (
                <>
                  <Link
                    href="/notifications"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors",
                      pathname.startsWith("/notifications") ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      নোটিফিকেশন
                    </span>
                    {notificationCount > 0 && (
                      <span className="h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                  </Link>
                  {user.role === "PATIENT" && (
                    <Link
                      href="/my/prescriptions"
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors",
                        pathname.startsWith("/my/prescriptions") ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <FileText className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      প্রেসক্রিপশন
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors",
                      pathname.startsWith("/profile") ? "bg-teal-50 text-teal-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <UserIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    প্রোফাইল
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Logout */}
          {user && (
            <div className="p-3 border-t border-gray-100 shrink-0">
              <Link
                href="/api/auth/signout"
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                লগ আউট
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
