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
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '20';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    
    // Get all approved channel IDs
    const channels = await db.channel.findMany({
      select: { id: true, name: true }
    });

    const channelIds = channels.map(channel => channel.id);
    
    if (channelIds.length === 0) {
      return NextResponse.json([]);
    }

    // If API key is not configured or is demo key, return mock data
    if (!apiKey || apiKey === 'demo_key_for_testing') {
      const mockVideos = channels.slice(0, 3).map((channel, index) => ({
        id: `demo_search_${channel.id}_${index}`,
        title: `نتيجة بحث تجريبية لـ "${query}" - ${channel.name}`,
        description: `هذا فيديو تجريبي يظهر نتائج البحث عن "${query}" في قناة ${channel.name}`,
        thumbnailUrl: `https://picsum.photos/seed/search_${query}_${channel.id}/320/180.jpg`,
        channelTitle: channel.name,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last week
        channelId: channel.id,
      }));

      return NextResponse.json(mockVideos);
    }

    // Search for videos in approved channels
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(query)}&part=snippet,id&order=relevance&maxResults=${maxResults}&type=video&videoEmbeddable=true`
    );

    if (!response.ok) {
      throw new Error('Failed to search videos from YouTube');
    }

    const data = await response.json();
    const allVideos: YouTubeVideo[] = data.items || [];

    // Filter videos to only show those from approved channels
    const filteredVideos = allVideos.filter(video => 
      channelIds.includes(video.snippet.channelId)
    );

    const formattedVideos = filteredVideos.map((video) => ({
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
    console.error('Error searching videos:', error);
    return NextResponse.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    );
  }
}