import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    // Add cache headers for better performance
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      'CDN-Cache-Control': 'public, s-maxage=600',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=600'
    };

    // Use most popular videos endpoint
    const popularUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=12®ionCode=SA&key=${apiKey}`;
    
    const response = await fetch(popularUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const videos = (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('ar-SA'),
      viewCount: formatViewCount(item.statistics?.viewCount || '0')
    }));

    const apiResponse = NextResponse.json({ videos });
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      apiResponse.headers.set(key, value);
    });
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching popular videos:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch popular videos' 
    }, { status: 500 });
  }
}

function formatViewCount(count: string): string {
  const num = parseInt(count) || 0;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return count;
}