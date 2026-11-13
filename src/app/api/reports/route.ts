import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/types";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { stripHtmlTags } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    // Rate Limiting (Max 5 reports per minute per IP to prevent spam attacks)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`report_${ip}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "تم إرسال بلاغات متعددة مؤخراً، يرجى الانتظار دقيقة قبل إرسال بلاغ جديد" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = reportSchema.parse(body);

    const safeDetails = stripHtmlTags(validated.details);

    const report = await prisma.report.create({
      data: {
        propertyId: validated.propertyId,
        reason: validated.reason,
        details: safeDetails,
      },
    });

    return NextResponse.json({ success: true, reportId: report.id, message: "شكراً لك، تم إرسال البلاغ للإدارة للمتابعة" });
  } catch (error: any) {
    console.error("Report POST error:", error);
    return NextResponse.json({ success: false, error: "فشل إرسال البلاغ" }, { status: 400 });
  }
}
