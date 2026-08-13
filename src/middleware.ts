import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin');
  const isClientRoute = pathname.startsWith('/client');

  // Bypass auth check for login routes
  if (pathname === '/admin/login' || pathname === '/client/login') {
    return NextResponse.next();
  }

  // If route is not protected under /admin or /client, allow through
  if (!isAdminRoute && !isClientRoute) {
    return NextResponse.next();
  }

  // Extract session token from HttpOnly cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const token = sessionCookie?.value;

  const isApiRoute = pathname.startsWith('/api/');

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL(isAdminRoute ? '/admin/login' : '/client/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT token signature and expiration
  const session = await verifySessionToken(token);

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or tampered session token.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL(isAdminRoute ? '/admin/login' : '/client/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route authorization
  if (isAdminRoute) {
    // /admin/* routes REQUIRE role === 'admin'
    if (session.role !== 'admin') {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  } else if (isClientRoute) {
    // /client/* routes REQUIRE role === 'client' AND valid tenantId
    if (session.role !== 'client' || !session.tenantId) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Forbidden: Client access required.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/client/login', request.url));
    }
  }

  // Session verified & role authorized -> Pass through
  const response = NextResponse.next();
  
  // Attach verified user claims to request headers for downstream consumption
  response.headers.set('x-user-role', session.role);
  if (session.role === 'client') {
    response.headers.set('x-tenant-id', session.tenantId);
  }

  return response;
}

// Next.js Middleware Matcher configuration
export const config = {
  matcher: ['/admin', '/admin/:path*', '/client', '/client/:path*'],
};
