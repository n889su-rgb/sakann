import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`lead:${clientIp}`, {
      limit: 20,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "تم إرسال عدد كبير من الطلبات، يرجى الانتظار دقيقة واحدة." },
        { status: 429 }
      );
    }

    const user = await getCurrentUser();
    const body = await request.json();
    const validated = leadSchema.parse(body);

    // 1. Create lead record with tenant details
    const lead = await prisma.contactLead.create({
      data: {
        propertyId: validated.propertyId,
        type: validated.type,
        viewerId: user?.id || null,
        viewerPhone: validated.viewerPhone || user?.phone || null,
        viewerIp: clientIp,
      },
    });

    // 2. Increment leadsCount on property
    await prisma.property.update({
      where: { id: validated.propertyId },
      data: { leadsCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error: any) {
    console.error("API Lead Record Error:", error);
    return NextResponse.json({ success: false, error: "فشل تسجيل الاتصال" }, { status: 400 });
  }
}
