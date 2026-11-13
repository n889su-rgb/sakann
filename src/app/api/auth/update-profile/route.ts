import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, signToken, COOKIE_NAME } from "@/lib/auth";
import { stripHtmlTags } from "@/lib/sanitize";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "يرجى كتابة الاسم بالكامل").optional(),
  phone: z.string().min(9, "رقم الهاتف غير صحيح").regex(/^[0-9+\s]+$/, "يرجى إدخال أرقام فقط").optional(),
  avatarUrl: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const updateData: any = {};

    if (validated.name) {
      updateData.name = stripHtmlTags(validated.name.trim());
    }

    if (validated.phone) {
      let cleanPhone = validated.phone.replace(/[^0-9]/g, "");
      if (cleanPhone.length === 9) {
        cleanPhone = "249" + cleanPhone;
      } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
        cleanPhone = "249" + cleanPhone.slice(1);
      }

      // Check if phone already registered by another user
      const existing = await prisma.user.findFirst({
        where: {
          phone: cleanPhone,
          NOT: { id: user.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "رقم الهاتف هذا مسجل مسبقاً لدى مستخدم آخر" },
          { status: 400 }
        );
      }
      updateData.phone = cleanPhone;
    }

    if (validated.avatarUrl !== undefined) {
      updateData.avatarUrl = validated.avatarUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Re-issue token
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
      message: "تم تحديث بيانات الحساب بنجاح!",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
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
    console.error("Update Profile Error:", error);
    return NextResponse.json(
      { success: false, error: error.errors?.[0]?.message || error.message || "فشل تحديث البيانات" },
      { status: 400 }
    );
  }
}
