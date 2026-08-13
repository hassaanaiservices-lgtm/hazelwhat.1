import { NextResponse } from 'next/server';
import { findTenantByCredentials } from '@/lib/db';
import { signSessionToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const tenant = await findTenantByCredentials(username, password);

    if (!tenant) {
      return NextResponse.json({ error: 'Invalid client credentials.' }, { status: 401 });
    }

    if (tenant.status === 'suspended' || tenant.status === 'inactive') {
      return NextResponse.json(
        { error: 'Account suspended or inactive. Please contact system administrator.' },
        { status: 403 }
      );
    }

    // Generate JWT token with client role and explicit tenantId
    const token = await signSessionToken({
      role: 'client',
      tenantId: tenant.id,
      sub: tenant.slug,
    });

    const response = NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      },
    });

    // Attach HttpOnly cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Client authentication failed.' }, { status: 500 });
  }
}
