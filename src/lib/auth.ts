import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "ptp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado. Defina AUTH_SECRET no .env.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "STAFF" | "CLIENT";
  clientId: string | null;
  sessionVersion: number;
  name: string;
  email: string;
  // Snapshot at login time, used only for proxy.ts's fast/coarse pre-redirect — NOT the source of
  // truth. The authoritative check (requireModule) re-reads permissions from the database on
  // every request, so a stale JWT here can at worst show a nav item for a split second longer
  // than it should, never grant real access to a page or an API route.
  modulePermissions: string[];
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
