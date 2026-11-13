import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { jwtVerify } from "jose";

const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, "رمز تفويض إعادة التعيين مفقود"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف"),
    confirmPassword: z.string().min(1, "يرجى تأكيد كلمة المرور"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "sakan-super-secure-jwt-secret-key-production-ready-2026"
);

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: Max 5 attempts per 10 minutes per IP
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`reset_pw_${ip}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز عدد المحاولات المسموح بها، يرجى الانتظار والمحاولة لاحقاً",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    // 2. Cryptographic Token Verification
    let payload: any;
    try {
      const verified = await jwtVerify(validated.resetToken, SECRET_KEY);
      payload = verified.payload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "جلسة إعادة التعيين منتهية أو غير صالحة، يرجى إعادة طلب رمز التحقق مجدداً",
        },
        { status: 401 }
      );
    }

    if (!payload?.userId || !payload?.otpId || payload.purpose !== "PASSWORD_RESET") {
      return NextResponse.json(
        {
          success: false,
          error: "تصريح غير مصرح به لإعادة تعيين كلمة المرور",
        },
        { status: 403 }
      );
    }

    // 3. Verify OTP record in database
    const otpRecord = await prisma.passwordResetOtp.findUnique({
      where: { id: payload.otpId },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "طلب استعادة كلمة المرور غير موجود أو تم إبطاله",
        },
        { status: 400 }
      );
    }

    // 4. Prevent replay attacks (Single-use enforcement)
    if (otpRecord.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "تم استخدام هذا الرمز مسبقاً، يرجى بدء عملية استعادة جديدة",
        },
        { status: 400 }
      );
    }

    // 5. Check if expired
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد",
        },
        { status: 400 }
      );
    }

    // 6. Hash new password securely with bcrypt
    const passwordHash = await bcrypt.hash(validated.newPassword, 12);

    // 7. Atomic Database Transaction:
    // Update user password AND mark OTP as used atomically
    await prisma.$transaction([
      // Update User password
      prisma.user.update({
        where: { id: payload.userId },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
        },
      }),

      // Mark this OTP as consumed
      prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),

      // Invalidate all active OTPs for this user
      prisma.passwordResetOtp.updateMany({
        where: {
          userId: payload.userId,
          isUsed: false,
        },
        data: { isUsed: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.errors?.[0]?.message || error.message || "فشل إعادة تعيين كلمة المرور",
      },
      { status: 400 }
    );
  }
}
