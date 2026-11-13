import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ENV_GOOGLE_CLIENT_ID_KEY = ["NEXT", "PUBLIC", "GOOGLE", "CLIENT", "ID"].join("_");
const ENV_GOOGLE_CLIENT_SECRET_KEY = ["GOOGLE", "CLIENT", "SECRET"].join("_");

export async function GET() {
  const clientId = (process.env as any)[ENV_GOOGLE_CLIENT_ID_KEY] || "";
  const isConfigured = Boolean(clientId && !clientId.includes("YOUR_GOOGLE_CLIENT_ID"));

  return NextResponse.json({
    configured: isConfigured,
    clientId: isConfigured ? clientId : "",
  });
}

export async function POST(request: Request) {
  try {
    const { clientId, clientSecret } = await request.json();

    if (!clientId || !clientId.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال Google Client ID صحيح" },
        { status: 400 }
      );
    }

    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Update or add NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (envContent.includes(`${ENV_GOOGLE_CLIENT_ID_KEY}=`)) {
      envContent = envContent.replace(
        new RegExp(`${ENV_GOOGLE_CLIENT_ID_KEY}=.*`, "g"),
        `${ENV_GOOGLE_CLIENT_ID_KEY}="${clientId.trim()}"`
      );
    } else {
      envContent += `\n${ENV_GOOGLE_CLIENT_ID_KEY}="${clientId.trim()}"`;
    }

    if (clientSecret && clientSecret.trim()) {
      if (envContent.includes(`${ENV_GOOGLE_CLIENT_SECRET_KEY}=`)) {
        envContent = envContent.replace(
          new RegExp(`${ENV_GOOGLE_CLIENT_SECRET_KEY}=.*`, "g"),
          `${ENV_GOOGLE_CLIENT_SECRET_KEY}="${clientSecret.trim()}"`
        );
      } else {
        envContent += `\n${ENV_GOOGLE_CLIENT_SECRET_KEY}="${clientSecret.trim()}"`;
      }
    }

    fs.writeFileSync(envPath, envContent, "utf-8");

    // Also update runtime process.env
    (process.env as any)[ENV_GOOGLE_CLIENT_ID_KEY] = clientId.trim();
    if (clientSecret) (process.env as any)[ENV_GOOGLE_CLIENT_SECRET_KEY] = clientSecret.trim();

    return NextResponse.json({
      success: true,
      message: "تم حفظ إعدادات Google OAuth بنجاح!",
      clientId: clientId.trim(),
    });
  } catch (err: any) {
    console.error("Config Save Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "فشل حفظ الإعدادات" },
      { status: 500 }
    );
  }
}
