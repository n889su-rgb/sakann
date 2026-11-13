import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { stripHtmlTags } from "@/lib/sanitize";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول إلى هذه العملية" },
        { status: 403 }
      );
    }
    const rawUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isVerified: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            leadsInitiated: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let landlordsCount = 0;
    let tenantsCount = 0;
    let adminsCount = 0;

    const users = rawUsers.map((u) => {
      const isAdmin = u.role === "ADMIN" || u.role === "SUPER_ADMIN";
      const hasProperties = u._count.properties > 0;

      if (hasProperties) {
        landlordsCount++;
      } else if (!isAdmin) {
        tenantsCount++;
      }

      if (isAdmin) {
        adminsCount++;
      }

      let userType: "ADMIN" | "LANDLORD" | "TENANT" = "TENANT";
      let userTypeLabel = "مستأجر / باحث عن سكن";

      if (hasProperties) {
        userType = "LANDLORD";
        userTypeLabel = isAdmin ? "مؤجر ومعلن (مشرف)" : "مؤجر ومعلن";
      } else if (isAdmin) {
        userType = "ADMIN";
        userTypeLabel = "مشرف لوحة التحكم";
      } else {
        userType = "TENANT";
        userTypeLabel = "مستأجر / باحث عن سكن";
      }

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        isVerified: u.isVerified,
        isBanned: u.isBanned,
        createdAt: u.createdAt,
        propertiesCount: u._count.properties,
        leadsCount: u._count.leadsInitiated,
        userType,
        userTypeLabel,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: rawUsers.length,
        landlordsCount,
        tenantsCount,
        adminsCount,
      },
      users,
    });
  } catch (error: any) {
    console.error("Admin Users GET error:", error);
    return NextResponse.json(
      { success: false, error: "فشل جلب بيانات المستخدمين" },
      { status: 500 }
    );
  }
}

// POST: Create a new appointed Admin
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
    const { name, email, phone, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة اسم المدير الجديد" },
        { status: 400 }
      );
    }

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: "كلمة المرور يجب ألا تقل عن 6 أحرف" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة بريد إلكتروني أو رقم هاتف للمدير الجديد" },
        { status: 400 }
      );
    }

    let cleanPhone: string | null = null;
    if (phone && phone.trim()) {
      const digits = phone.replace(/[^0-9]/g, "");
      if (digits.length === 9) {
        cleanPhone = "249" + digits;
      } else if (digits.startsWith("0") && digits.length === 10) {
        cleanPhone = "249" + digits.slice(1);
      } else if (digits.length > 0) {
        cleanPhone = digits;
      }
    }

    const cleanEmail = email && email.trim() ? email.toLowerCase().trim() : null;

    // Check if phone or email already exists
    if (cleanEmail) {
      const existingEmail = await prisma.user.findFirst({ where: { email: cleanEmail } });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: "البريد الإلكتروني مسجل مسبقاً، يمكنك ترقية الحساب مباشرة" },
          { status: 400 }
        );
      }
    }

    if (cleanPhone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "رقم الهاتف مسجل مسبقاً، يمكنك ترقية الحساب مباشرة" },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const sanitizedName = stripHtmlTags(name.trim());

    const newAdmin = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: "ADMIN",
        isVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم تعيين المشرف (${newAdmin.name}) بنجاح!`,
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role,
        isVerified: newAdmin.isVerified,
      },
    });
  } catch (error: any) {
    console.error("Create Admin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل تعيين المشرف الجديد" },
      { status: 500 }
    );
  }
}

// PATCH: Promote or Demote an existing user to/from ADMIN
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول إلى هذه العملية" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    if (role !== "ADMIN" && role !== "USER") {
      return NextResponse.json(
        { success: false, error: "الدور المحدد غير صالح" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // Safeguard the main platform admin
    if (targetUser.email === "admin@sakan.app" && role === "USER") {
      return NextResponse.json(
        { success: false, error: "لا يمكن إلغاء صلاحية المشرف الأساسي لمنصة سكن" },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    const actionText = role === "ADMIN" ? "ترقية إلى مدير" : "تحويل إلى مستخدم عادي";
    return NextResponse.json({
      success: true,
      message: `تمت ${actionText} للمستخدم (${updated.name}) بنجاح!`,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        isVerified: updated.isVerified,
      },
    });
  } catch (error: any) {
    console.error("Update User Role error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل تعديل صلاحيات المستخدم" },
      { status: 500 }
    );
  }
}
