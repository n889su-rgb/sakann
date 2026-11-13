import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const { searchParams } = new URL(request.url);
  const redirectTarget = searchParams.get("redirect") || "/";

  // Dynamically determine host URL so redirectUri matches request origin (localhost or trycloudflare)
  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const referer = request.headers.get("referer");
  let appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  // If referer is present and from cloudflare or a different origin, prefer referer origin
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.origin && !refUrl.origin.includes("localhost") && !refUrl.origin.includes("127.0.0.1")) {
        appUrl = refUrl.origin;
      }
    } catch {}
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  console.log(`[Google OAuth] Initiating login with redirect_uri: "${redirectUri}"`);

  if (!clientId || clientId.trim() === "" || clientId.includes("YOUR_GOOGLE_CLIENT_ID")) {
    // If client ID not yet configured in .env, redirect with parameter to show setup guidance
    return NextResponse.redirect(new URL("/login?google_setup_required=true", appUrl));
  }

  // Construct real Google OAuth 2.0 authorization URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId.trim());
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account"); // Forces real Google Account Chooser
  googleAuthUrl.searchParams.set("access_type", "online");
  googleAuthUrl.searchParams.set("state", redirectTarget);

  return NextResponse.redirect(googleAuthUrl.toString());
}
