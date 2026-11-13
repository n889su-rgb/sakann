import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  identifier: z.string().min(1, "يرجى إدخال رقم الهاتف أو البريد الإلكتروني"),
  password: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    // Anti-Brute-Force Rate Limiter (Max 10 attempts per minute per IP)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`login_${ip}`, { limit: 10, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز عدد محاولات الدخول المسموح بها، يرجى الانتظار دقيقة والمحاولة لاحقاً لحماية حسابك",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const rawIdentifier = body.identifier || body.phone || "";
    const validated = loginSchema.parse({
      identifier: rawIdentifier,
      password: body.password,
    });

    const input = validated.identifier.trim();
    const inputLower = input.toLowerCase();

    let cleanPhone = input.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 9) {
      cleanPhone = "249" + cleanPhone;
    } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
      cleanPhone = "249" + cleanPhone.slice(1);
    }
    const local9 = cleanPhone.length >= 9 && cleanPhone.startsWith("249") ? cleanPhone.slice(3) : cleanPhone;

    // Search flexibly by email, username/name, or phone
    const orConditions: any[] = [
      { email: inputLower },
      { name: input },
      { name: inputLower },
    ];

    if (inputLower === "user") {
      orConditions.push({ email: "user@sakan.app" });
    }
    if (inputLower === "admin") {
      orConditions.push({ email: "admin@sakan.app" });
    }

    if (cleanPhone && cleanPhone.length >= 7) {
      orConditions.push(
        { phone: cleanPhone },
        { phone: `0${local9}` },
        { phone: local9 },
        { phone: `+249${local9}` },
        { phone: input }
      );
    } else {
      orConditions.push({ phone: input });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: orConditions,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "بيانات الدخول غير مسجلة لدينا مسبقاً، يرجى التأكد من اسم المستخدم أو البريد الإلكتروني أو رقم الهاتف",
          notFound: true,
        },
        { status: 404 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, error: "تم حظر هذا الحساب لمخالفة شروط الاستخدام" },
        { status: 403 }
      );
    }

    // 1. Tenant or Google User without password -> Login directly with phone (No password required!)
    if (!user.passwordHash) {
      const isProfileComplete = Boolean(user.phone);
      const token = await signToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.email || "",
        role: user.role,
        isProfileComplete,
      });

      const response = NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح!",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isProfileComplete,
        },
      });

      const isHttps = process.env.NODE_ENV === "production" || request.headers.get("x-forwarded-proto") === "https";
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // 2. Landlord or Admin User with password -> Requires password check
    if (!validated.password) {
      return NextResponse.json({
        success: false,
        requiresPassword: true,
        userName: user.name,
        userRole: user.role,
        error: "هذا الحساب محمي بكلمة مرور، يرجى كتابة كلمة المرور للمتابعة",
      });
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, requiresPassword: true, error: "كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const isProfileComplete = Boolean(user.phone);
    const token = await signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || user.email || "",
      role: user.role,
      isProfileComplete,
    });

    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح!",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isProfileComplete,
      },
    });

    const isHttps = process.env.NODE_ENV === "production" || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء تسجيل الدخول" },
      { status: 400 }
    );
  }
}
