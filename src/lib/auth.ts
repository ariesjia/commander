import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SALT_ROUNDS = 10;
const SESSION_COOKIE = "mech_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const PIN_LOCKOUT_MS = 60 * 1000; // 1 minute
const MAX_PIN_ATTEMPTS = 5;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export interface SessionPayload {
  userId: string;
  email: string;
  mode: "parent" | "student";
  exp: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET or NEXTAUTH_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getSecret());
  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE, MAX_PIN_ATTEMPTS, PIN_LOCKOUT_MS };

// In-memory PIN lockout (MVP). Key: userId, Value: { attempts, lockedUntil }
const pinLockout = new Map<string, { attempts: number; lockedUntil: number }>();

export function recordPinFailure(userId: string): { locked: boolean; remainingAttempts?: number } {
  const now = Date.now();
  let entry = pinLockout.get(userId);

  if (entry && now < entry.lockedUntil) {
    return { locked: true };
  }

  if (!entry || now >= entry.lockedUntil) {
    entry = { attempts: 0, lockedUntil: 0 };
  }

  entry.attempts += 1;
  if (entry.attempts >= MAX_PIN_ATTEMPTS) {
    entry.lockedUntil = now + PIN_LOCKOUT_MS;
    pinLockout.set(userId, entry);
    return { locked: true };
  }

  pinLockout.set(userId, entry);
  return { locked: false, remainingAttempts: MAX_PIN_ATTEMPTS - entry.attempts };
}

export function clearPinFailures(userId: string): void {
  pinLockout.delete(userId);
}

export function isPinLocked(userId: string): boolean {
  const entry = pinLockout.get(userId);
  if (!entry) return false;
  return Date.now() < entry.lockedUntil;
}

export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;
  return verifySessionToken(token);
}
