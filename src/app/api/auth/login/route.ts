import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  identifier: z.string().min(1, "يرجى إدخال البريد الإلكتروني أو رقم الهاتف"),
  password: z.string().min(1, "يرجى إدخال كلمة المرور"),
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
    const rawIdentifier = body.identifier || body.phone || body.email || "";
    const validated = loginSchema.parse({
      identifier: rawIdentifier,
      password: body.password,
    });

    const input = validated.identifier.trim();
    const inputLower = input.toLowerCase();

    // Auto-detect phone format: strip non-digits and leading zeros
    let digits = input.replace(/[^0-9]/g, "");
    if (digits.startsWith("249")) digits = digits.slice(3);
    while (digits.startsWith("0")) digits = digits.slice(1);

    const cleanPhone = digits.length >= 7 ? `249${digits.slice(0, 9)}` : "";
    const local9 = digits.slice(0, 9);

    // Search flexibly by email, phone, or name
    const orConditions: any[] = [
      { email: inputLower },
      { name: input },
      { name: inputLower },
    ];

    if (inputLower === "user") {
      orConditions.push({ email: "user@sakan.app" });
    }
    if (inputLower === "admin") {
      orConditions.push({ email: "admin@sakan.app" }, { email: "admin@bayt.app" });
    }

    if (cleanPhone) {
      orConditions.push(
        { phone: cleanPhone },
        { phone: `0${local9}` },
        { phone: local9 },
        { phone: `+249${local9}` },
        { phone: input }
      );
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
          error: "بيانات الدخول غير مسجلة لدينا مسبقاً، يرجى التأكد من البريد أو رقم الهاتف أو إنشاء حساب جديد",
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

    // Password Verification
    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          {
            success: false,
            error: "كلمة المرور غير صحيحة، يرجى التأكد والمحاولة مرة أخرى أو الضغط على \"نسيت كلمة السر\"",
          },
          { status: 401 }
        );
      }
    } else {
      // If user had no password set previously, adopt this entered password automatically
      const newHash = await bcrypt.hash(validated.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
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
