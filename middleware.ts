import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files and Next.js internal paths from middleware
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has('JSESSIONID');

  // If user is trying to access protected routes (like /vehicles) without auth
  if (pathname.startsWith('/vehicles') && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is accessing root, redirect to either vehicles or login
  if (pathname === '/') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/vehicles', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If user is accessing login but is already authenticated
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/vehicles', request.url));
  }

  return NextResponse.next();
}

// Define the routes that the middleware should run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
