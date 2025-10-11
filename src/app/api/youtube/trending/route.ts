import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      console.error('YouTube API key not configured');
      return NextResponse.json({ 
        error: 'YouTube API key not configured',
        details: 'Please add YOUTUBE_API_KEY to your environment variables'
      }, { status: 500 });
    }

    console.log('Attempting to fetch trending videos with API key:', apiKey ? 'Key exists' : 'No key');

    // Add cache headers for better performance
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      'CDN-Cache-Control': 'public, s-maxage=600',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=600'
    };

    let videos = [];
    
    // Use a popular search query to simulate trending videos
    try {
      const trendingUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=trending&order=relevance&type=video&maxResults=12&key=${apiKey}`;
      
      console.log('Fetching from trending endpoint:', trendingUrl);
      
      const response = await fetch(trendingUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('Trending endpoint response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Trending endpoint response data:', data);

        if (data.error) {
          console.error('YouTube API error from trending endpoint:', data.error);
          throw new Error(data.error.message);
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
            
            console.log('Details endpoint response status:', detailsResponse.status);
            
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              console.log('Details endpoint response data:', detailsData);

              videos = data.items.map((item: any) => {
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
            } else {
              // Fallback without view counts
              videos = data.items.map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                channelTitle: item.snippet.channelTitle,
                publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('ar-SA'),
                viewCount: '0'
              }));
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Trending endpoint failed:', response.status, errorText);
        
        // Try to parse error response
        let errorMessage = `Trending endpoint failed: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.error.message) {
            errorMessage = `YouTube API error: ${errorData.error.message}`;
          }
        } catch {
          // If we can't parse the error, use the status code
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Trending endpoint approach failed:', error);
      // Return empty array to avoid breaking the UI
      videos = [];
    }

    const apiResponse = NextResponse.json({ videos });
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      apiResponse.headers.set(key, value);
    });
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch trending videos',
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