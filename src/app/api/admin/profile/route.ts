import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser, signToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول إلى هذه العملية" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phone, password, confirmPassword } = body;

    const updateData: any = {};
    const messages: string[] = [];

    // 1. Phone Update
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      let cleanPhone = trimmedPhone.replace(/[^0-9]/g, "");

      if (cleanPhone.length === 9) {
        cleanPhone = "249" + cleanPhone;
      } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
        cleanPhone = "249" + cleanPhone.slice(1);
      }

      if (cleanPhone !== currentUser.phone) {
        // Check if phone taken by another user
        if (cleanPhone) {
          const existing = await prisma.user.findFirst({
            where: {
              phone: cleanPhone,
              NOT: { id: currentUser.id },
            },
          });
          if (existing) {
            return NextResponse.json(
              { success: false, error: "رقم الهاتف المدخل مسجل بالفعل لحساب آخر" },
              { status: 400 }
            );
          }
        }
        updateData.phone = cleanPhone || null;
        messages.push("تم تحديث رقم هاتف المشرف");
      }
    }

    // 2. Password Update
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام" },
          { status: 400 }
        );
      }
      if (confirmPassword && password !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: "كلمتا المرور غير متطابقتين" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password.trim(), 10);
      updateData.passwordHash = passwordHash;
      messages.push("تم تغيير كلمة المرور بنجاح");
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "لم يتم إجراء أي تغييرات",
        user: currentUser,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    // Refresh JWT session cookie
    const token = await signToken({
      userId: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: messages.join(" و ") || "تم حفظ البيانات بنجاح",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Admin Profile update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل تحديث بيانات المشرف" },
      { status: 500 }
    );
  }
}
