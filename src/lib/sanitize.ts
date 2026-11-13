/**
 * SAKAN Security Suite: Input Sanitization & Anti-XSS Engine
 * Prevents Cross-Site Scripting (XSS), SQLi remnants, and HTML injection attacks.
 */

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

/**
 * Strips all HTML tags and suspicious scripts completely, returning clean plain text.
 */
export function stripHtmlTags(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

/**
 * Sanitizes phone numbers to standard numeric digits
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/[^0-9]/g, "");
}
