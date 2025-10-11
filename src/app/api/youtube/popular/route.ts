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

    console.log('Attempting to fetch popular videos with API key:', apiKey ? 'Key exists' : 'No key');

    // Add cache headers for better performance
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      'CDN-Cache-Control': 'public, s-maxage=600',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=600'
    };

    // Try multiple approaches to get popular videos
    let videos = [];
    
    // Approach 1: Most popular videos with region code
    try {
      const popularUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=12®ionCode=US&key=${apiKey}`;
      
      console.log('Fetching from popular endpoint:', popularUrl);
      
      const response = await fetch(popularUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('Popular endpoint response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Popular endpoint response data:', data);

        if (data.error) {
          console.error('YouTube API error from popular endpoint:', data.error);
          throw new Error(data.error.message);
        }

        videos = (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('ar-SA'),
          viewCount: formatViewCount(item.statistics?.viewCount || '0')
        }));
      } else {
        const errorText = await response.text();
        console.error('Popular endpoint failed:', response.status, errorText);
        throw new Error(`Popular endpoint failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Popular endpoint approach failed, trying fallback:', error);
      
      // Approach 2: Search for popular videos as fallback
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=popular&order=relevance&type=video&maxResults=12&key=${apiKey}`;
        
        console.log('Trying search fallback:', searchUrl);
        
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        console.log('Search fallback response status:', searchResponse.status);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log('Search fallback response data:', searchData);

          if (searchData.error) {
            throw new Error(searchData.error.message);
          }

          // Get video details for the search results
          if (searchData.items && searchData.items.length > 0) {
            const videoIds = searchData.items.map((item: any) => item.id.videoId).filter(Boolean).join(',');
            
            if (videoIds) {
              const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
              
              const detailsResponse = await fetch(detailsUrl, {
                headers: {
                  'Accept': 'application/json',
                }
              });
              
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                
                videos = searchData.items.map((item: any) => {
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
              }
            }
          }
        }
      } catch (fallbackError) {
        console.error('Search fallback also failed:', fallbackError);
        // Return empty array with success status to avoid breaking the UI
        videos = [];
      }
    }

    const apiResponse = NextResponse.json({ videos });
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      apiResponse.headers.set(key, value);
    });
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching popular videos:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch popular videos',
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