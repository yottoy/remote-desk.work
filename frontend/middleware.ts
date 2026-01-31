/**
 * Next.js Middleware for URL normalization
 * 
 * Handles:
 * 1. Non-www to www redirects (fixes GSC duplicate content issues)
 * 2. Trailing slash normalization
 * 3. Security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // 1. Redirect non-www to www (except localhost and Vercel preview URLs)
  // Use 308 (Permanent Redirect) to preserve method and body
  if (
    !hostname.startsWith('www.') &&
    !hostname.startsWith('localhost') &&
    !hostname.includes('.vercel.app') &&
    hostname.includes('clickclickjob.com')
  ) {
    console.log(`Redirecting non-www to www: ${hostname}`);
    url.host = `www.${hostname}`;
    // Use 308 instead of 301 for better SEO (preserves POST/GET)
    return NextResponse.redirect(url, 308);
  }
  
  // 2. Remove trailing slashes (except root)
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return NextResponse.redirect(url, 308);
  }
  
  // 3. Continue with request and add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (png, jpg, svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$).*)',
  ],
};

