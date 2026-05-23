import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const path = request.nextUrl.pathname;

  // Log immediately to verify the middleware is executing
  console.log('[Auth Middleware] Incoming request: %s', path);

  if (authHeader) {
    try {
      const authValue = authHeader.split(' ')[1] || '';
      
      console.log('[Auth Middleware] Verifying authValue: %s', authValue);
            // Use atob() for Base64 decoding to ensure compatibility with the Edge Runtime
      const decoded = atob(authValue);
      const [user, pass] = decoded.split(':');

      console.log('[Auth Middleware] Verifying credentials - User: %s, Pass: %s', user, pass);

      console.log('[Auth Middleware] Comparison credentials - User: %s, Pass: %s',  process.env.USERNAME, process.env.PASSWORD);

      if (user === process.env.USERNAME && pass === process.env.PASSWORD) {
        console.log('[Auth Middleware] Successful authentication for user: %s', user);
        return NextResponse.next();
      }
      console.warn('[Auth Middleware] Authentication failed for user: %s', user);
    } catch (error) {
      console.error('[Auth Middleware] Error decoding Authorization header: %s', error instanceof Error ? error.message : 'Unknown error');
    }
  } else {
    console.warn('[Auth Middleware] Access denied: No Authorization header for %s', path);
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  });
}

export const config = {
  matcher: '/api/:path*',
};