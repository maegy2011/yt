import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'youtubei';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = searchParams.get('page') || '1';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    console.log('Searching for:', query, 'page:', page);
    
    const youtube = new Client();
    const searchResults = await youtube.search(query, {
      type: 'video'
    });

    // Get all videos by paginating through results
    let allVideos: any[] = [];
    let currentResults = searchResults;
    
    // Add first page videos
    if (currentResults.items) {
      allVideos = allVideos.concat(currentResults.items);
      console.log(`Initial page: ${currentResults.items.length} videos`);
    }

    // Load additional pages if needed - fetch more to have enough for pagination
    const targetPage = parseInt(page);
    const itemsPerPage = 20;
    const totalItemsNeeded = targetPage * itemsPerPage;
    const maxPagesToFetch = 10; // Limit to prevent infinite loops
    let pagesFetched = 1;

    // Always fetch at least 6 pages (120 videos) to demonstrate pagination
    const minimumItemsNeeded = Math.max(totalItemsNeeded, 120);

    while (allVideos.length < minimumItemsNeeded && pagesFetched < maxPagesToFetch) {
      try {
        console.log(`Fetching page ${pagesFetched + 1}, current videos: ${allVideos.length}`);
        
        if ((currentResults as any).hasContinuation) {
          const nextResults = await currentResults.next();
          pagesFetched++;
          
          if (nextResults && nextResults.length > 0) {
            allVideos = allVideos.concat(nextResults);
            console.log(`Fetched ${nextResults.length} more videos, total: ${allVideos.length}`);
            
            // Update currentResults for next iteration
            if (currentResults.items) {
              currentResults.items = currentResults.items.concat(nextResults);
            } else {
              currentResults.items = nextResults;
            }
          } else {
            console.log('No more results available');
            break;
          }
        } else {
          console.log('No continuation available');
          break;
        }
      } catch (err) {
        console.log('Error getting next page:', err);
        break;
      }
    }

    const videos = allVideos.map((video: any) => ({
      id: video.id,
      title: video.title || '',
      description: video.description || '',
      duration: video.duration || '',
      viewCount: video.viewCount ? video.viewCount.toString() : '',
      published: video.uploadedAt || '',
      channelName: video.channel?.name || '',
      channelId: video.channel?.id || '',
      thumbnail: video.thumbnails?.[0]?.url || '',
      badges: video.badges || []
    }));

    // Simple pagination logic
    const startIndex = (targetPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVideos = videos.slice(startIndex, endIndex);

    console.log(`Returning ${paginatedVideos.length} videos for page ${targetPage}, total videos: ${videos.length}, total pages: ${Math.ceil(videos.length / itemsPerPage)}`);

    return NextResponse.json({
      videos: paginatedVideos,
      currentPage: targetPage,
      totalPages: Math.ceil(videos.length / itemsPerPage),
      totalResults: videos.length
    });

  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { error: 'Failed to search YouTube', details: (error as Error).message },
      { status: 500 }
    );
  }
}