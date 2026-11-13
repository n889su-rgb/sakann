import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول إلى هذه العملية" },
        { status: 403 }
      );
    }
    const reports = await prisma.report.findMany({
      include: {
        property: {
          select: { id: true, title: true, city: true, contactPhone: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("Admin Reports GET error:", error);
    return NextResponse.json({ success: false, error: "فشل جلب البلاغات" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول إلى هذه العملية" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportId, status, action } = body;

    // Optional: if action is "BAN_PROPERTY", ban the property too
    if (action === "BAN_PROPERTY") {
      const rep = await prisma.report.findUnique({ where: { id: reportId } });
      if (rep) {
        await prisma.property.update({
          where: { id: rep.propertyId },
          data: { status: "BANNED" },
        });
      }
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status || "RESOLVED",
        actionTaken: action || undefined,
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "فشل تحديث البلاغ" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json({ success: false, error: "معرف البلاغ مفقود" }, { status: 400 });
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ success: true, message: "تم حذف البلاغ بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "فشل حذف البلاغ" }, { status: 400 });
  }
}
