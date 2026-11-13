import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "sakan-super-secure-jwt-secret-key-production-ready-2026"
);

export const COOKIE_NAME = "sakan_session";

export interface SessionPayload {
  userId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  isProfileComplete?: boolean;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifyToken(token);
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      isVerified: true,
      isBanned: true,
      avatarUrl: true,
    },
  });

  if (!user || user.isBanned) return null;

  return user;
}
