import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let email = "";
    let name = "";
    let avatarUrl: string | undefined = undefined;

    // 1. If real Google ID Token (credential) is passed from Google Identity Services
    if (body.credential) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`
        );

        if (!verifyRes.ok) {
          return NextResponse.json(
            { success: false, error: "رمز مصادقة Google غير صالح أو منتهي الصلاحية" },
            { status: 400 }
          );
        }

        const googlePayload = await verifyRes.json();

        if (!googlePayload.email) {
          return NextResponse.json(
            { success: false, error: "تعذر استخراج البريد الإلكتروني من حساب Google" },
            { status: 400 }
          );
        }

        email = googlePayload.email.toLowerCase().trim();
        name = googlePayload.name || email.split("@")[0];
        avatarUrl = googlePayload.picture;
      } catch (err) {
        console.error("Failed to verify Google token with Google servers:", err);
        return NextResponse.json(
          { success: false, error: "تعذر التحقق من خوادم Google الرسمية" },
          { status: 500 }
        );
      }
    } else if (body.email && body.name) {
      // Fallback for direct profile payload
      email = body.email.toLowerCase().trim();
      name = body.name.trim();
      avatarUrl = body.avatarUrl;
    } else {
      return NextResponse.json(
        { success: false, error: "بيانات تسجيل الدخول عبر Google غير مكتملة" },
        { status: 400 }
      );
    }

    // 2. Find or create user in database
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
      // Update avatar if not present
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl },
      });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, error: "تم حظر هذا الحساب لمخالفة شروط الاستخدام" },
        { status: 403 }
      );
    }

    const isProfileComplete = Boolean(user.phone);
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    // 3. Issue SAKAN JWT Session Token (Admin phone is optional and added later in dashboard)
    const token = await signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      isProfileComplete: isAdmin ? true : isProfileComplete,
    });

    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول الفعلي بحساب Google بنجاح!",
      isProfileComplete: isAdmin ? true : isProfileComplete,
      isAdmin,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isProfileComplete: isAdmin ? true : isProfileComplete,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Google Auth Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل تسجيل الدخول الفعلي عبر Google" },
      { status: 400 }
    );
  }
}
