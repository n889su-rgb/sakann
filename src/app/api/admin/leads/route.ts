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
    const leads = await prisma.contactLead.findMany({
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            district: true,
            price: true,
            currency: true,
            contactPhone: true,
            whatsappNumber: true,
            landlord: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        viewer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error("Admin Leads GET error:", error);
    return NextResponse.json({ success: false, error: "فشل جلب سجل الاتصالات" }, { status: 500 });
  }
}
