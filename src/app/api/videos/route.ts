import { NextRequest, NextResponse } from 'next/server';

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
    const channelId = searchParams.get('channelId');
    const maxResults = searchParams.get('maxResults') || '12';

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey === 'demo_key_for_testing') {
      // Return mock data for testing when API key is not configured
      const mockVideos = [
        {
          id: 'demo_video_1',
          title: 'فيديو تجريبي 1 - تلاوة قرآنية',
          description: 'هذا فيديو تجريبي لعرض كيفية عمل التطبيق',
          thumbnailUrl: 'https://picsum.photos/seed/quran1/320/180.jpg',
          channelTitle: 'قناة إسلامية',
          publishedAt: new Date().toISOString(),
          channelId: channelId,
        },
        {
          id: 'demo_video_2',
          title: 'فيديو تجريبي 2 - درس ديني',
          description: 'هذا فيديو تجريبي آخر لعرض كيفية عمل التطبيق',
          thumbnailUrl: 'https://picsum.photos/seed/islam2/320/180.jpg',
          channelTitle: 'قناة إسلامية',
          publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          channelId: channelId,
        },
        {
          id: 'demo_video_3',
          title: 'فيديو تجريبي 3 - خطبة جمعة',
          description: 'هذا فيديو تجريبي ثالث لعرض كيفية عمل التطبيق',
          thumbnailUrl: 'https://picsum.photos/seed/khutbah3/320/180.jpg',
          channelTitle: 'قناة إسلامية',
          publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          channelId: channelId,
        },
      ];

      return NextResponse.json(mockVideos);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch videos from YouTube');
    }

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
    }));

    return NextResponse.json(formattedVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}