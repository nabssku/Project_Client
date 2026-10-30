import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/villas", "/promo", "/artikel", "/about", "/booking", "/login", "/register", "/forgot-password"];
const apiPublicPaths = [
  "/api/auth",
  "/api/public",
  "/api/bookings",
  "/api/promos",
  "/api/villas",
  "/api/config",
  "/api/upload/payment-proof",
  "/api/search",
  "/api/media",
];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Public pages
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // Public API routes
  if (apiPublicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Static files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Protected routes require auth
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Dashboard routes
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
