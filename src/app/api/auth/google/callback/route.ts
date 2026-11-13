import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/";
  const error = searchParams.get("error");

  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  console.log(`[Google OAuth Callback] Processing callback with redirect_uri: "${redirectUri}"`);

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("تم إلغاء تسجيل الدخول عبر Google")}`, appUrl)
    );
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    // 1. Exchange authorization code for tokens with Google's OAuth server
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(
            tokenData.error_description || "فشل الحصول على تصريح من Google"
          )}`,
          appUrl
        )
      );
    }

    // 2. Fetch authenticated user profile from Google's userinfo endpoint
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userRes.json();

    if (!profile.email) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("تعذر استرجاع البريد الإلكتروني من Google")}`, appUrl)
      );
    }

    const email = profile.email.toLowerCase().trim();
    const name = profile.name || email.split("@")[0];
    const avatarUrl = profile.picture;

    // 3. Find or create user in SAKAN DB
    let user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          avatarUrl,
          role: "USER",
          isVerified: true,
        },
      });
    } else if (avatarUrl && !user.avatarUrl) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });
    }

    if (user.isBanned) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("تم حظر هذا الحساب لمخالفة شروط الاستخدام")}`, appUrl)
      );
    }

    const isProfileComplete = Boolean(user.phone);
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    // 4. Issue SAKAN JWT session
    // For Admins: phone is optional and can be added later inside admin dashboard
    // For Regular Users: phone is required, so incomplete profiles must visit /complete-profile
    const token = await signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      isProfileComplete: isAdmin ? true : isProfileComplete,
    });

    let targetUrl = "/";
    if (isAdmin) {
      targetUrl = "/admin";
    } else if (!isProfileComplete) {
      targetUrl = "/complete-profile";
    } else if (state && state.startsWith("/")) {
      targetUrl = state;
    }

    const response = NextResponse.redirect(new URL(targetUrl, appUrl));

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || appUrl.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("Google Callback Error:", err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("حدث خطأ أثناء معالجة حساب Google")}`, appUrl)
    );
  }
}
