import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateSecureOtp, hashOtp, sendPasswordResetOtpEmail } from "@/lib/mail";

const forgotPasswordSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
});

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: Max 5 requests per 10 minutes per IP
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`forgot_pw_${ip}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز الحد المسموح به لطلبات الاستعادة، يرجى الانتظار بضع دقائق والمحاولة مجدداً",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);
    const cleanEmail = validated.email.trim().toLowerCase();

    // 2. Find user in PostgreSQL
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    // 3. Verify user exists in the database
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "هذا البريد الإلكتروني غير مسجل في منصة سكن، يرجى التأكد من البريد أو إنشاء حساب جديد.",
        },
        { status: 404 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: "هذا الحساب محظور لمخالفة شروط الاستخدام",
        },
        { status: 403 }
      );
    }

    // 4. Invalidate all previous unused OTPs for this user
    await prisma.passwordResetOtp.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // 5. Generate secure 6-digit OTP & hash it
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);

    // 6. Set 5-minute lifespan
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 7. Store in PostgreSQL
    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
    });

    // 8. Dispatch Email via Gmail SMTP
    await sendPasswordResetOtpEmail(user.email!, otp, user.name);

    return NextResponse.json({
      success: true,
      message: "تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني بنجاح!",
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.errors?.[0]?.message || error.message || "حدث خطأ أثناء معالجة الطلب",
      },
      { status: 400 }
    );
  }
}
