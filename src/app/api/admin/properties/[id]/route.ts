import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "غير مصرح لك بتنفيذ هذه العملية" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    const updated = await prisma.property.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ success: true, property: updated });
  } catch (error: any) {
    console.error("Property PATCH error:", error);
    return NextResponse.json({ success: false, error: "فشل تحديث حالة العقار" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "غير مصرح لك بتنفيذ هذه العملية" }, { status: 403 });
    }

    await prisma.property.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "تم حذف العقار بنجاح" });
  } catch (error: any) {
    console.error("Property DELETE error:", error);
    return NextResponse.json({ success: false, error: "فشل حذف العقار" }, { status: 400 });
  }
}
