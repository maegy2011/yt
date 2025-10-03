import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = searchParams.get('maxResults') || '24';

    const apiKey = process.env.YOUTUBE_API_KEY;
    
    // Get all approved channels
    const channels = await db.channel.findMany({
      orderBy: {
        addedAt: 'desc'
      }
    });

    if (channels.length === 0) {
      return NextResponse.json([]);
    }

    // If API key is not configured or is demo key, return mock data
    if (!apiKey || apiKey === 'demo_key_for_testing') {
      const mockVideos = channels.map((channel, index) => [
        {
          id: `demo_video_${channel.id}_1`,
          title: `فيديو تجريبي 1 - ${channel.name}`,
          description: `هذا فيديو تجريبي لقناة ${channel.name}`,
          thumbnailUrl: `https://picsum.photos/seed/${channel.id}_1/320/180.jpg`,
          channelTitle: channel.name,
          publishedAt: new Date().toISOString(),
          channelId: channel.id,
          channelName: channel.name,
          channelThumbnail: channel.thumbnailUrl,
        },
        {
          id: `demo_video_${channel.id}_2`,
          title: `فيديو تجريبي 2 - ${channel.name}`,
          description: `هذا فيديو تجريبي آخر لقناة ${channel.name}`,
          thumbnailUrl: `https://picsum.photos/seed/${channel.id}_2/320/180.jpg`,
          channelTitle: channel.name,
          publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          channelId: channel.id,
          channelName: channel.name,
          channelThumbnail: channel.thumbnailUrl,
        }
      ]).flat();

      // Sort and limit results
      const sortedVideos = mockVideos
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, parseInt(maxResults));

      return NextResponse.json(sortedVideos);
    }

    // Fetch latest videos from each channel
    const allVideos: any[] = [];
    
    for (const channel of channels) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channel.id}&part=snippet,id&order=date&maxResults=5&type=video`
        );

        if (response.ok) {
          const data = await response.json();
          const videos: YouTubeVideo[] = data.items || [];
          
          const formattedVideos = videos.map((video) => ({
            id: video.id.videoId,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium.url,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            channelId: video.snippet.channelId,
            channelName: channel.name,
            channelThumbnail: channel.thumbnailUrl,
          }));
          
          allVideos.push(...formattedVideos);
        }
      } catch (error) {
        console.error(`Error fetching videos for channel ${channel.id}:`, error);
      }
    }

    // Sort all videos by publish date and limit results
    const sortedVideos = allVideos
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, parseInt(maxResults));

    return NextResponse.json(sortedVideos);
  } catch (error) {
    console.error('Error fetching latest videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest videos' },
      { status: 500 }
    );
  }
}