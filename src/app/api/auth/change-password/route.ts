import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف"),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أولاً لتغيير كلمة المرور" },
        { status: 401 }
      );
    }

    // Rate limit password change attempts: 5 per 5 minutes per user/IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`change-pw:${user.id}:${clientIp}`, {
      limit: 5,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "تم تجاوز عدد المحاولات، يرجى المحاولة بعد 5 دقائق." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    // Fetch user with full passwordHash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "المستخدم غير موجود" }, { status: 404 });
    }

    // If user already has a password set, require and verify current password
    if (dbUser.passwordHash) {
      if (!validated.currentPassword) {
        return NextResponse.json(
          { success: false, error: "يرجى إدخال كلمة المرور الحالية" },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(validated.currentPassword, dbUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "كلمة المرور الحالية غير صحيحة" },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ وتحديث كلمة المرور بنجاح!",
    });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return NextResponse.json(
      { success: false, error: error.errors?.[0]?.message || error.message || "فشل تغيير كلمة المرور" },
      { status: 400 }
    );
  }
}
