import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const hostname = request.headers.get('host') || '';
  const origin = request.headers.get('origin') || '';

  // Dynamic CORS configuration for production
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = hostname.includes('vercel.app');
  
  // Allowed origins based on environment
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://preview-chat-2538e102-abe4-4a65-a4ac-68c71e90c7f3.space.z.ai',
    'https://space.z.ai'
  ];

  // Add current production domain
  if (isProduction && isVercel) {
    allowedOrigins.push(`https://${hostname}`);
  }

  // Add custom domain if set
  const customDomain = process.env.NEXT_PUBLIC_APP_URL;
  if (customDomain) {
    allowedOrigins.push(customDomain);
  }

  // CORS handling
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (isProduction && isVercel) {
    // Allow same-origin requests in production
    response.headers.set('Access-Control-Allow-Origin', `https://${hostname}`);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // Privacy and Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // Dynamic Content Security Policy
  const cspDomains = [
    "'self'",
    "https://www.youtube-nocookie.com",
    "https://www.youtube.com",
    "https://i.ytimg.com"
  ];

  // Add production domains to CSP
  if (isProduction && isVercel) {
    cspDomains.push(`https://${hostname}`);
  }

  if (customDomain) {
    cspDomains.push(customDomain);
  }

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube-nocookie.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https: blob:`,
    `font-src 'self' data:`,
    `media-src 'self' https://www.youtube-nocookie.com`,
    `connect-src 'self' ${cspDomains.join(' ')}`,
    `frame-src 'self' https://www.youtube-nocookie.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self' ${cspDomains.filter(d => d !== "'self'").join(' ')}`,
    'upgrade-insecure-requests'
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  
  // Strict Transport Security (only in production)
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Cache control for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
  }

  // Remove tracking headers
  response.headers.delete('X-Powered-By');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};