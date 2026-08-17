import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/doctor/dashboard",
  "/diagnostic/dashboard",
  "/admin",
];

const roleRoutes: Record<string, string[]> = {
  PATIENT: ["/dashboard"],
  DOCTOR: ["/doctor/dashboard"],
  DIAGNOSTIC: ["/diagnostic/dashboard"],
  ADMIN: ["/admin"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth) {
    const role = req.auth.user?.role;
    const allowed = roleRoutes[role ?? ""] ?? [];

    // Prevent wrong role from accessing wrong dashboard
    if (pathname.startsWith("/doctor/dashboard") && role !== "DOCTOR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/diagnostic/dashboard") && role !== "DIAGNOSTIC" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
