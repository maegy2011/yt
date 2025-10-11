import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    console.error('Search query parameter is required');
    return NextResponse.json({ 
      error: 'Query parameter is required',
      details: 'Please provide a search query'
    }, { status: 400 });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.error('YouTube API key not configured');
      return NextResponse.json({ 
        error: 'YouTube API key not configured',
        details: 'Please add YOUTUBE_API_KEY to your environment variables'
      }, { status: 500 });
    }

    console.log('Attempting to search for:', query, 'with API key:', apiKey ? 'Key exists' : 'No key');

    // Add cache headers for better performance
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'public, s-maxage=300',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=300'
    };

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${apiKey}`;
    
    console.log('Fetching from search endpoint:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('Search endpoint response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search endpoint failed:', response.status, errorText);
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Search endpoint response data:', data);

    if (data.error) {
      console.error('YouTube API error from search endpoint:', data.error);
      return NextResponse.json({ 
        error: data.error.message,
        videos: [] 
      }, { status: 200 }); // Return 200 to prevent UI breaking
    }

    // Get video details for view counts only if we have results
    if (data.items && data.items.length > 0) {
      const videoIds = data.items.map((item: any) => item.id.videoId).filter(Boolean).join(',');
      
      if (videoIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
        
        console.log('Fetching video details for:', videoIds);
        
        const detailsResponse = await fetch(detailsUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        console.log('Details endpoint response status:', detailsResponse.status);
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          console.log('Details endpoint response data:', detailsData);

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
        } else {
          console.error('Details endpoint failed, returning videos without view counts');
          // Fallback without view counts
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
        }
      }
    }

    // Fallback if no items or details fetch fails
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
      error: error instanceof Error ? error.message : 'Failed to search videos',
      videos: [] // Always return empty videos array to avoid UI breaking
    }, { status: 200 }); // Return 200 even on error to prevent UI breaking
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