import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    // Add cache headers for better performance
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'public, s-maxage=300',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=300'
    };

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${apiKey}`;
    
    const response = await fetch(searchUrl, {
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

    // Get video details for view counts only if we have results
    if (data.items && data.items.length > 0) {
      const videoIds = data.items.map((item: any) => item.id.videoId).filter(Boolean).join(',');
      
      if (videoIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
        
        const detailsResponse = await fetch(detailsUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();

          const videos = data.items.map((item: any) => {
            const videoDetails = detailsData.items?.find((detail: any) => detail.id === item.id.videoId);
            const viewCount = videoDetails?.statistics?.viewCount || '0';
            
            return {
              id: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
              channelTitle: item.snippet.channelTitle,
              publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('ar-SA'),
              viewCount: formatViewCount(viewCount)
            };
          });

          const apiResponse = NextResponse.json({ videos });
          Object.entries(cacheHeaders).forEach(([key, value]) => {
            apiResponse.headers.set(key, value);
          });
          
          return apiResponse;
        }
      }
    }

    // Fallback if details fetch fails
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('ar-SA'),
      viewCount: '0'
    }));

    const apiResponse = NextResponse.json({ videos });
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      apiResponse.headers.set(key, value);
    });
    
    return apiResponse;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to search videos' 
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