import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const userAgent = request.headers.get('user-agent');
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    access: {
      origin: origin || 'unknown',
      host: host || 'unknown',
      userAgent: userAgent || 'unknown',
      isExternal: origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')
    },
    server: {
      port: 3000,
      mode: process.env.NODE_ENV || 'development'
    },
    features: {
      youtubeApi: true,
      privacyProtection: true,
      adBlocking: true,
      corsEnabled: true,
      externalAccess: true
    }
  });
}