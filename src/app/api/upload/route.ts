import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Megabytes

export async function POST(request: Request) {
  try {
    // 1. Rate Limit Uploads (Max 20 uploads / minute per IP)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`upload_${ip}`, { limit: 20, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز الحد المسموح به لرفع الملفات، يرجى الانتظار دقيقة والمحاولة مجدداً",
        },
        { status: 429 }
      );
    }

    // 2. Authentication Check: Only logged-in users may upload
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول لرفع الصور" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "لم يتم اختيار أي ملف" }, { status: 400 });
    }

    // 3. MIME Type Validation (Strictly prohibit SVGs and executables)
    const mimeType = (file.type || "").toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: "نوع الصورة غير مدعوم، يرجى رفع صورة بصيغة JPG أو PNG أو WebP فقط" },
        { status: 400 }
      );
    }

    // 4. File Size Validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "حجم الصورة يتجاوز الحد المسموح به (5 ميجابايت)" },
        { status: 400 }
      );
    }

    // 5. File Extension Sanitization
    const rawExt = file.name.split(".").pop()?.toLowerCase().trim() || "jpg";
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : "jpg";

    // 6. Cryptographically Random Safe Filename
    const randomName = crypto.randomBytes(16).toString("hex");
    const filename = `sakan_${Date.now()}_${randomName}.${ext}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(uploadPath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error("Secure Upload Error:", error);
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء حفظ الصورة" }, { status: 500 });
  }
}
