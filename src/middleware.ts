import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const path = request.nextUrl.pathname;

  // Log immediately to verify the middleware is executing
  console.log('[Auth Middleware] Incoming request: %s', path);

  if (authHeader) {
    try {
      const [scheme, authValue] = authHeader.split(' ');
      
      if (scheme !== 'Basic' || !authValue) {
        throw new Error('Invalid Authorization scheme');
      }

      // Use atob() for Base64 decoding to ensure compatibility with the Edge Runtime
      const decoded = atob(authValue);
      const colonIndex = decoded.indexOf(':');
      
      if (colonIndex === -1) {
        throw new Error('Invalid format: missing colon');
      }

      const user = decoded.substring(0, colonIndex);
      const pass = decoded.substring(colonIndex + 1);

      // Use trim() to ensure accidental whitespace in .env values doesn't break comparison
      const expectedUser = (process.env.USERNAME || '').trim();
      const expectedPass = (process.env.PASSWORD || '').trim();

      console.log('[Auth Middleware] Verifying credentials - User: %s, Pass: %s', user, pass);
      console.log('[Auth Middleware] Comparison credentials - User: %s, Pass: %s', expectedUser, expectedPass);

      if (expectedUser && expectedPass && user === expectedUser && pass === expectedPass) {
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