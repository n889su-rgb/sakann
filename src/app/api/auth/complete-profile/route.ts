import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, signToken, COOKIE_NAME } from "@/lib/auth";
import { stripHtmlTags } from "@/lib/sanitize";
import { z } from "zod";

const completeProfileSchema = z.object({
  name: z.string().min(2, "يرجى كتابة الاسم بالكامل"),
  phone: z.string().min(9, "رقم الهاتف غير صحيح").regex(/^[0-9+\s]+$/, "يرجى إدخال أرقام فقط"),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول بحسابك أولاً" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = completeProfileSchema.parse(body);

    let cleanPhone = validated.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 9) {
      cleanPhone = "249" + cleanPhone;
    } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
      cleanPhone = "249" + cleanPhone.slice(1);
    }

    const local9 = cleanPhone.startsWith("249") ? cleanPhone.slice(3) : cleanPhone;

    // Check if phone already registered by another user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `0${local9}` },
          { phone: local9 },
          { phone: `+249${local9}` },
        ],
        NOT: { id: user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "رقم الهاتف هذا مسجل مسبقاً لدى مستخدم آخر، يرجى استخدام رقمك الخاص" },
        { status: 400 }
      );
    }

    // Update the user profile (name, phone, verified)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: stripHtmlTags(validated.name.trim()),
        phone: cleanPhone,
        isVerified: true,
      },
    });

    // Issue updated session with isProfileComplete = true
    const token = await signToken({
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isProfileComplete: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "تم حفظ وتأكيد بيانات حسابك بنجاح! يمكنك الآن تصفح المنصة وإضافة الشقق.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        isProfileComplete: true,
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
    console.error("Complete Profile Error:", error);
    return NextResponse.json(
      { success: false, error: error.errors?.[0]?.message || error.message || "فشل حفظ بيانات الحساب" },
      { status: 400 }
    );
  }
}
