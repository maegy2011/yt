import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    // Check if API key is configured
    const status = {
      youtubeApiKey: apiKey ? 'Configured' : 'Not configured',
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'N/A',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    // Test YouTube API connection if key exists
    if (apiKey) {
      try {
        const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${apiKey}`;
        const response = await fetch(testUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        status.apiTest = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };

        if (response.ok) {
          const data = await response.json();
          status.apiTest.resultCount = data.items ? data.items.length : 0;
          status.apiTest.hasError = !!data.error;
          if (data.error) {
            status.apiTest.error = data.error.message;
          }
        }
      } catch (error) {
        status.apiTest = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check API status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}