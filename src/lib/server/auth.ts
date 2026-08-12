import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { SESSION_SECRET } from './env';

// ---- Password hashing (scrypt, no external dependency) ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  const derived = scryptSync(password, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// ---- Stateless signed session cookie (HMAC-SHA256, no DB lookup) ----

export const SESSION_COOKIE = 'sid';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function signSession(user: App.SessionUser): string {
  const payload = { ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac('sha256', SESSION_SECRET()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): App.SessionUser | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = b64url(createHmac('sha256', SESSION_SECRET()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: payload.id, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: true,
  maxAge: MAX_AGE
};
