import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * Generates a cryptographically secure 6-digit numeric OTP (100000 - 999999)
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes SHA-256 hash of the OTP for safe database storage
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Constant-time hash verification to prevent timing attacks
 */
export function verifyOtpHash(inputOtp: string, storedHash: string): boolean {
  try {
    const inputHash = hashOtp(inputOtp);
    const inputBuffer = Buffer.from(inputHash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (inputBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(inputBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Configures Gmail SMTP Transporter
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Builds branded SAKAN RTL HTML email template
 */
function buildOtpEmailHtml(otp: string, userName?: string): string {
  const greeting = userName ? `مرحباً ${userName}` : "مرحباً بك";
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز استعادة كلمة المرور - سكن</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header with BAYT Branding -->
          <tr>
            <td style="background-color: #1e3a2f; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                بَيْت <span style="font-size: 14px; font-weight: 600; color: #6ee7b7; letter-spacing: 2px;">BAYT</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px;">المنصة الأولى للشقق المفروشة في السودان</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px; color: #334155;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                ${greeting} 👋
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.7; color: #475569;">
                تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة بيت. استخدم رمز التحقق التالي لإكمال العملية:
              </p>

              <!-- OTP Code Box -->
              <div style="background-color: #f0fdf4; border: 2px dashed #86efac; border-radius: 16px; padding: 20px; text-align: center; margin: 28px 0;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #166534; margin-bottom: 8px;">رمز التحقق الخاص بك (OTP)</span>
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #15803d; font-family: monospace;">
                  ${otp}
                </span>
                <span style="display: block; font-size: 12px; color: #64748b; margin-top: 10px;">
                  ⏱️ الرمز صالح لمدة <strong>5 دقائق فقط</strong>
                </span>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fffbeb; border-right: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #92400e; font-weight: 600;">
                  ⚠️ تحذير أمني: لا تشارك هذا الرمز مع أي شخص، بما في ذلك فريق دعم بيت.
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                إذا لم تكن أنت من طلب استعادة كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان؛ فحسابك لا يزال محمياً تماماً.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">منصة بيت &copy; ${new Date().getFullYear()} — جميع الحقوق محفوظة</p>
              <p style="margin: 4px 0 0 0; font-size: 11px;">هذه الرسالة تم إرسالها تلقائياً، يرجى عدم الرد عليها.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends OTP Email via Gmail SMTP with fallback to console logging
 */
export async function sendPasswordResetOtpEmail(
  email: string,
  otp: string,
  userName?: string
): Promise<{ success: boolean; devMode?: boolean; error?: string }> {
  try {
    const transporter = getTransporter();

    // If SMTP credentials not provided in .env, log OTP to console for seamless local dev
    if (!transporter) {
      console.log("\n=======================================================");
      console.log(`[SAKAN EMAIL DEV MODE] 📧 Password Reset OTP for: ${email}`);
      console.log(`[SAKAN EMAIL DEV MODE] 🔑 OTP CODE: ${otp}`);
      console.log(`[SAKAN EMAIL DEV MODE] ⏱️ Expires in: 5 minutes`);
      console.log("=======================================================\n");

      return {
        success: true,
        devMode: true,
      };
    }

    const fromAddress = process.env.SMTP_FROM || `منصة بيت <${process.env.SMTP_USER}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `رمز استعادة كلمة المرور لمنصة بَيْت: ${otp}`,
      html: buildOtpEmailHtml(otp, userName),
      text: `مرحباً، رمز استعادة كلمة المرور لمنصة بَيْت هو: ${otp} (صالح لمدة 5 دقائق). لا تشاركه مع أحد.`,
    });

    console.log(`[BAYT EMAIL] ✅ OTP sent successfully to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error("[BAYT EMAIL ERROR] Failed to send email:", error.message || error);
    // In case of SMTP network/auth error during dev, log the OTP anyway so the flow doesn't block
    console.log("\n[BAYT EMAIL FALLBACK] OTP CODE:", otp, "for:", email, "\n");
    return {
      success: false,
      error: error.message || "فشل إرسال البريد الإلكتروني عبر خادم SMTP",
    };
  }
}
