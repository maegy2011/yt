import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    // Check environment variables
    const databaseUrl = process.env.DATABASE_URL;
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    const healthStatus = {
      status: dbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        url: databaseUrl ? 'configured' : 'missing',
        provider: databaseUrl?.includes('postgresql') ? 'postgresql' : 'sqlite'
      },
      youtube: {
        apiKey: youtubeApiKey ? 'configured' : 'missing',
        isDemo: youtubeApiKey === 'demo_key_for_testing'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}