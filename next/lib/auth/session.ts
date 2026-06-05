import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "./constants";

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "taymaz-mock-dev-session-secret";

export type SessionCookieOptions = {
  httpOnly: true;
  path: "/";
  sameSite: "lax";
  maxAge: number;
  secure: boolean;
};

export function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === "production",
  };
}

function signSession(adminId: number, expiresAt: number): string {
  const payload = `${adminId}.${expiresAt}`;
  const sig = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** کوکی امضا‌شده — بدون وابستگی به حافظه in-memory (پایدار در HMR و چند worker) */
export function createSessionToken(adminId: number): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SEC * 1000;
  return signSession(adminId, expiresAt);
}

export function resolveSessionAdminId(token: string | undefined): number | null {
  if (!token?.trim()) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const adminId = Number(parts[0]);
  const expiresAt = Number(parts[1]);
  const sig = parts[2];

  if (!Number.isFinite(adminId) || !Number.isFinite(expiresAt)) return null;
  if (expiresAt < Date.now()) return null;
  if (!sig) return null;

  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`${adminId}.${expiresAt}`)
    .digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return adminId;
}

export async function getSessionAdminId(): Promise<number | null> {
  const cookieStore = await cookies();
  return resolveSessionAdminId(cookieStore.get(SESSION_COOKIE)?.value);
}

export function applySessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export function clearSessionCookieOnResponse(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
}

/** @deprecated از applySessionCookie روی NextResponse استفاده کنید */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
