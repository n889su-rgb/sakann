import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { stripHtmlTags } from "@/lib/sanitize";

const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  phone: z.string().min(9, "رقم الهاتف غير صحيح").regex(/^[0-9+\s]+$/, "يرجى إدخال أرقام فقط"),
  password: z.string().optional().nullable(),
  isLandlord: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate Limiting on Registration (Max 5 accounts per minute per IP to prevent bot account creation)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`register_${ip}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "تم تجاوز حد إنشاء الحسابات المسموح به مؤقتاً، يرجى الانتظار دقيقة" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = registerSchema.parse(body);

    const safeName = stripHtmlTags(validated.name);

    let cleanPhone = validated.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 9) {
      cleanPhone = "249" + cleanPhone;
    } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
      cleanPhone = "249" + cleanPhone.slice(1);
    }

    const local9 = cleanPhone.startsWith("249") ? cleanPhone.slice(3) : cleanPhone;

    // Check existing phone in all formats
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `0${local9}` },
          { phone: local9 },
          { phone: `+249${local9}` },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "رقم الهاتف مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة" },
        { status: 400 }
      );
    }

    let passwordHash: string | null = null;
    if (validated.password && validated.password.trim().length >= 4) {
      passwordHash = await bcrypt.hash(validated.password.trim(), 10);
    }

    const newUser = await prisma.user.create({
      data: {
        name: safeName,
        phone: cleanPhone,
        passwordHash,
        role: "USER",
        isVerified: true,
      },
    });

    const token = await signToken({
      userId: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
      isProfileComplete: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح!",
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        isProfileComplete: true,
      },
    });

    const isHttps = process.env.NODE_ENV === "production" || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: error.errors?.[0]?.message || error.message || "فشل إنشاء الحساب" },
      { status: 400 }
    );
  }
}
