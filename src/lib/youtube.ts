import { Client } from 'youtubei';

let youtubeInstance: Client | null = null;

export async function getYouTubeInstance() {
  if (!youtubeInstance) {
    try {
      youtubeInstance = new Client();
    } catch (error) {
      console.error('Failed to create YouTube instance:', error);
      throw error;
    }
  }
  return youtubeInstance;
}

export async function searchVideos(query: string, page = 1) {
  try {
    const youtube = await getYouTubeInstance();
    const search = await youtube.search(query);
    
    const videos = search.items || [];
    
    return {
      videos: videos.slice(0, 20).map((video: any) => ({
        id: video.id,
        title: video.title || '',
        description: video.description || '',
        thumbnail: video.thumbnails?.[0]?.url || '',
        duration: video.duration || '',
        viewCount: video.viewCount?.toString() || '0',
        publishedAt: video.uploadedAt || '',
        channelName: video.channel?.name || '',
        channelId: video.channel?.id || '',
      })),
      hasMore: videos.length > 20,
      continuation: null,
    };
  } catch (error) {
    console.error('Search error:', error);
    // Return empty result on error to prevent crashes
    return {
      videos: [],
      hasMore: false,
      continuation: null,
    };
  }
}

export async function getVideoDetails(videoId: string) {
  try {
    const youtube = await getYouTubeInstance();
    const video = await youtube.getVideo(videoId);
    
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnails?.[0]?.url || '',
      duration: video.duration || '',
      viewCount: video.viewCount?.toString() || '0',
      publishedAt: video.uploadedAt || '',
      channelName: video.channel?.name || '',
      channelId: video.channel?.id || '',
      likes: video.likeCount?.toString() || '0',
    };
  } catch (error) {
    console.error('Get video details error:', error);
    throw error;
  }
}

export async function getChannelVideos(channelId: string) {
  try {
    const youtube = await getYouTubeInstance();
    const channel = await youtube.getChannel(channelId);
    const videos = channel.videos || [];
    
    return {
      videos: videos.slice(0, 20).map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        thumbnail: video.thumbnails?.[0]?.url || '',
        duration: video.duration || '',
        viewCount: video.viewCount?.toString() || '0',
        publishedAt: video.uploadedAt || '',
        channelName: video.channel?.name || '',
        channelId: video.channel?.id || '',
      })),
      hasMore: videos.length > 20,
    };
  } catch (error) {
    console.error('Get channel videos error:', error);
    // Return empty result on error to prevent crashes
    return {
      videos: [],
      hasMore: false,
    };
  }
}

export function formatViewCount(count: string): string {
  const num = parseInt(count.replace(/[^0-9]/g, ''));
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  }
  return `${num} views`;
}

export function formatDuration(duration: string): string {
  if (!duration) return '';
  
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return duration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatPublishDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}