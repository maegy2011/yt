import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'youtubei';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID parameter is required' }, { status: 400 });
    }

    console.log('Fetching video with ID:', videoId);
    
    const youtube = new Client();
    
    // Try to get video using full YouTube URL (youtubei expects full URL)
    let video;
    try {
      video = await youtube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);
    } catch (err) {
      console.log('Failed to get video with URL, trying short URL:', err);
      // Try with short URL
      try {
        video = await youtube.getVideo(`https://youtu.be/${videoId}`);
      } catch (err2) {
        console.log('Failed to get video with short URL:', err2);
        // Return basic video info without API call
        return NextResponse.json({
          id: videoId,
          title: 'Video Title',
          description: 'Video description not available',
          duration: '',
          viewCount: '',
          published: '',
          channelName: 'Channel Name',
          channelId: '',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          streamingUrl: `https://www.youtube-nocookie.com/watch?v=${videoId}`,
          quality: 'N/A',
          mimeType: 'N/A',
          width: 0,
          height: 0
        });
      }
    }

    if (!video) {
      // Return basic video info without API call
      return NextResponse.json({
        id: videoId,
        title: 'Video Title',
        description: 'Video description not available',
        duration: '',
        viewCount: '',
        published: '',
        channelName: 'Channel Name',
        channelId: '',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        streamingUrl: `https://www.youtube-nocookie.com/watch?v=${videoId}`,
        quality: 'N/A',
        mimeType: 'N/A',
        width: 0,
        height: 0
      });
    }

    console.log('Video data received:', {
      id: video.id,
      title: video.title,
      hasThumbnails: !!video.thumbnails,
      hasChannel: !!video.channel
    });

    return NextResponse.json({
      id: video.id || videoId,
      title: video.title || 'Unknown Title',
      description: video.description || '',
      duration: (video as any).duration || (video as any).length || '',
      viewCount: video.viewCount ? video.viewCount.toString() : '',
      published: (video as any).uploadDate || (video as any).uploadedAt || (video as any).published || '',
      channelName: video.channel?.name || (video as any).author?.name || '',
      channelId: video.channel?.id || (video as any).author?.id || '',
      thumbnail: video.thumbnails?.[0]?.url || (video as any).thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      streamingUrl: `https://www.youtube-nocookie.com/watch?v=${videoId}`, // Use YouTube embed URL
      quality: 'N/A',
      mimeType: 'N/A',
      width: 0,
      height: 0
    });

  } catch (error) {
    console.error('YouTube video info error:', error);
    // Return basic video info even on error
    const url = new URL(request.url);
    const videoId = url.searchParams.get('id');
    return NextResponse.json({
      id: videoId || '',
      title: 'Video Title',
      description: 'Video description not available',
      duration: '',
      viewCount: '',
      published: '',
      channelName: 'Channel Name',
      channelId: '',
      thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
      streamingUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
      quality: 'N/A',
      mimeType: 'N/A',
      width: 0,
      height: 0
    });
  }
}