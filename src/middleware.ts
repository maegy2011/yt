import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = request.cookies.get('auth-token')?.value;
  let isAuthenticated = false;
  let userRole = null;

  if (token) {
    try {
      // Verify token (simplified check - in production, verify JWT signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAuthenticated = true;
      userRole = payload.role;
    } catch (error) {
      // Invalid token
      isAuthenticated = false;
    }
  }

  // For setup check, we'll rely on the client-side SetupRedirect component
  // This avoids database connection issues in middleware
  // The middleware will only handle authentication and route protection

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Login page redirect if already authenticated
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Setup page redirect if already authenticated and setup is complete
  if (pathname === '/setup' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};