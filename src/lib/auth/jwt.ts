import { SignJWT, jwtVerify } from 'jose';

export interface AdminSessionPayload {
  role: 'admin';
  sub?: string;
}

export interface ClientSessionPayload {
  role: 'client';
  tenantId: string;
  sub?: string;
}

export type SessionPayload = AdminSessionPayload | ClientSessionPayload;

const DEFAULT_SECRET = 'dev-super-secret-jwt-signing-key-minimum-32-characters-long!';

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Sign a session JWT token using HS256.
 */
export async function signSessionToken(payload: SessionPayload, expiresIn = '7d'): Promise<string> {
  const secretKey = getSecretKey();
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verify and decode a session JWT token.
 * Returns decoded payload if valid signature and non-expired; returns null if tampered or invalid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (!payload || typeof payload.role !== 'string') {
      return null;
    }

    if (payload.role === 'admin') {
      return { role: 'admin', sub: payload.sub as string | undefined };
    }

    if (payload.role === 'client') {
      if (!payload.tenantId || typeof payload.tenantId !== 'string') {
        return null;
      }
      return {
        role: 'client',
        tenantId: payload.tenantId as string,
        sub: payload.sub as string | undefined,
      };
    }

    return null;
  } catch (error) {
    // Return null on invalid signature, expired token, or parsing failure
    return null;
  }
}

/**
 * Standard Session Cookie Configuration Options
 */
export const SESSION_COOKIE_NAME = 'hazelwhat_session';

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };
}
