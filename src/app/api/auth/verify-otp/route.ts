import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyOtpHash } from "@/lib/mail";
import { SignJWT } from "jose";

const verifyOtpSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
  otp: z.string().length(6, "رمز التحقق يجب أن يتكون من 6 أرقام").regex(/^[0-9]+$/, "الرمز يجب أن يحتوي على أرقام فقط"),
});

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "sakan-super-secure-jwt-secret-key-production-ready-2026"
);

export async function POST(request: Request) {
  try {
    // 1. Anti-Brute-Force Rate Limiting (Max 15 attempts / 5 mins per IP)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`verify_otp_${ip}`, {
      limit: 15,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز عدد محاولات التحقق المسموح بها، يرجى الانتظار دقيقة والمحاولة مجدداً",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = verifyOtpSchema.parse(body);
    const cleanEmail = validated.email.trim().toLowerCase();
    const cleanOtp = validated.otp.trim();

    // 2. Fetch user
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "رمز التحقق غير صحيح أو انتهت صلاحيته",
        },
        { status: 400 }
      );
    }

    // 3. Find latest OTP record for this user
    const latestOtp = await prisma.passwordResetOtp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp) {
      return NextResponse.json(
        {
          success: false,
          error: "لم يتم العثور على طلب استعادة نشط، يرجى طلب رمز جديد",
        },
        { status: 400 }
      );
    }

    // 4. Check if already used
    if (latestOtp.isUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "تم استخدام هذا الرمز مسبقاً، يرجى طلب رمز جديد",
        },
        { status: 400 }
      );
    }

    // 5. Check if expired (5 minutes)
    if (new Date() > latestOtp.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "انتهت صلاحية رمز التحقق (صالح لمدة 5 دقائق فقط)، يرجى طلب رمز جديد",
          isExpired: true,
        },
        { status: 400 }
      );
    }

    // 6. Check maximum attempts limit (Max 5 failed attempts per OTP)
    if (latestOtp.attempts >= 5) {
      // Invalidate the compromised OTP
      await prisma.passwordResetOtp.update({
        where: { id: latestOtp.id },
        data: { isUsed: true },
      });

      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز لحماية حسابك، يرجى طلب رمز جديد.",
          isLocked: true,
        },
        { status: 400 }
      );
    }

    // 7. Verify OTP Hash using timing-safe comparison
    const isValid = verifyOtpHash(cleanOtp, latestOtp.otpHash);

    if (!isValid) {
      const nextAttempts = latestOtp.attempts + 1;
      await prisma.passwordResetOtp.update({
        where: { id: latestOtp.id },
        data: { attempts: nextAttempts },
      });

      const remainingAttempts = Math.max(0, 5 - nextAttempts);

      if (remainingAttempts === 0) {
        await prisma.passwordResetOtp.update({
          where: { id: latestOtp.id },
          data: { isUsed: true },
        });

        return NextResponse.json(
          {
            success: false,
            error: "تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز لحماية حسابك، يرجى طلب رمز جديد.",
            isLocked: true,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `رمز التحقق غير صحيح، متبقي لديك ${remainingAttempts} محاولات.`,
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // 8. Issue a short-lived cryptographically signed token (Valid for 10 minutes)
    // This allows the user to securely proceed to the reset password step
    const resetToken = await new SignJWT({
      userId: user.id,
      otpId: latestOtp.id,
      purpose: "PASSWORD_RESET",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m")
      .sign(SECRET_KEY);

    return NextResponse.json({
      success: true,
      message: "تم التحقق من الرمز بنجاح! يمكنك الآن إعادة تعيين كلمة المرور.",
      resetToken,
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.errors?.[0]?.message || error.message || "فشل التحقق من الرمز",
      },
      { status: 400 }
    );
  }
}
