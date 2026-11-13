import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "sakan-super-secure-jwt-secret-key-production-ready-2026"
);

const COOKIE_NAME = "sakan_session";

// Auth pages for signing in, registering, or password reset
const AUTH_PAGES = [
  "/register",
  "/login",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, next internal files, uploads, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Bypass public authentication APIs and public GET APIs
  if (
    pathname.startsWith("/api/auth") ||
    (pathname === "/api/properties" && request.method === "GET") ||
    (pathname === "/api/admin/settings" && request.method === "GET")
  ) {
    return NextResponse.next();
  }

  // 3. Verify user session token
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;
  let userRole = "";
  let isProfileComplete = true;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      if (payload && payload.userId) {
        isAuthenticated = true;
        userRole = (payload.role as string) || "USER";
        if (payload.isProfileComplete === false) {
          isProfileComplete = false;
        }
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 3.5 Dedicated Admin Portal Protection
  if (pathname.startsWith("/admin")) {
    const isAdmin = isAuthenticated && (userRole === "ADMIN" || userRole === "SUPER_ADMIN");

    // A) Admin Login Page (/admin/login)
    if (pathname === "/admin/login") {
      // If already logged in as Admin, send straight to the admin dashboard
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      // Allow guests or non-admin to view dedicated admin login
      return NextResponse.next();
    }

    // B) Any Admin Dashboard or Subpage (/admin, /admin/...)
    if (!isAdmin) {
      // Always redirect to the dedicated admin login page, NEVER to regular user /login!
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  const isAuthPage = AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(page + "/")
  );

  // Guest-allowed pages: Home `/` and property view `/properties/[id]` (excluding `/properties/new`, `/properties/[id]/edit`, and `/favorites`)
  const isGuestAllowedPage =
    pathname === "/" ||
    (pathname.startsWith("/properties/") && pathname !== "/properties/new" && !pathname.endsWith("/edit")) ||
    isAuthPage;

  // 4. If trying to access protected API route without session or proper role
  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أو إنشاء حساب أولاً" },
        { status: 401 }
      );
    }

    // Strict RBAC: Prohibit non-admin users from accessing internal admin APIs
    if (pathname.startsWith("/api/admin") && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول إلى بيانات أو عمليات المشرفين" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 5. If NOT authenticated (Guest) and trying to access protected pages (like /properties/new or /profile)
  if (!isAuthenticated) {
    if (!isGuestAllowedPage) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 6. For regular users: if profile is INCOMPLETE (needs phone), enforce /complete-profile
  if (isAuthenticated && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN" && !isProfileComplete) {
    if (pathname !== "/complete-profile" && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/complete-profile", request.url));
    }
    return NextResponse.next();
  }

  // 7. If authenticated, prevent visiting login/register pages
  if (isAuthenticated) {
    if (
      pathname === "/login" ||
      pathname === "/register" ||
      (isProfileComplete && pathname === "/complete-profile")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
