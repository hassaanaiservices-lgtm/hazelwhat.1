import { NextResponse } from 'next/server';
import { signSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/jwt';
import { loginRateLimiter } from '@/lib/auth/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const identifier = username || 'admin';

    // 1. Rate Limit Check
    const limitCheck = loginRateLimiter.isRateLimited(identifier);
    if (limitCheck.isLimited) {
      return NextResponse.json(
        { error: limitCheck.reason || 'Too many failed login attempts. Please try again after 15 minutes.' },
        { status: 429, headers: { 'Retry-After': String(limitCheck.retryAfterSeconds || 900) } }
      );
    }

    // 2. Credentials Check (Admin Demo)
    if ((!username || username === 'admin') && password === 'AdminSecurePass2026!') {
      loginRateLimiter.resetOnSuccess(identifier);

      const token = await signSessionToken({ role: 'admin' });
      const cookieOptions = getSessionCookieOptions();

      const response = NextResponse.json({ success: true, redirectUrl: '/admin' });
      response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
      return response;
    }

    // Record Failed Attempt
    loginRateLimiter.recordFailedAttempt(identifier);
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
