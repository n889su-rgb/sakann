import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { systemSettingsSchema } from "@/lib/types";

export async function GET() {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: "singleton",
          commissionEnabled: true,
          landlordCommissionPercent: 5.0,
          tenantCommissionPercent: 5.0,
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ success: false, error: "فشل جلب الإعدادات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول إلى هذه العملية" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = systemSettingsSchema.parse(body);

    const updated = await prisma.systemSetting.upsert({
      where: { id: "singleton" },
      update: {
        commissionEnabled: validated.commissionEnabled,
        landlordCommissionPercent: validated.landlordCommissionPercent,
        tenantCommissionPercent: validated.tenantCommissionPercent,
        bankakAccountNumber: validated.bankakAccountNumber,
        bankakAccountName: validated.bankakAccountName,
        contactSupportPhone: validated.contactSupportPhone,
      },
      create: {
        id: "singleton",
        commissionEnabled: validated.commissionEnabled,
        landlordCommissionPercent: validated.landlordCommissionPercent,
        tenantCommissionPercent: validated.tenantCommissionPercent,
        bankakAccountNumber: validated.bankakAccountNumber,
        bankakAccountName: validated.bankakAccountName,
        contactSupportPhone: validated.contactSupportPhone,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "تم تحديث إعدادات العمولة والمنصة بنجاح!",
    });
  } catch (error: any) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      { success: false, error: error.errors?.[0]?.message || "فشل تحديث الإعدادات" },
      { status: 400 }
    );
  }
}
