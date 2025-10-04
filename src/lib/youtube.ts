export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnails: {
    default?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    high?: { url: string; width: number; height: number }
    standard?: { url: string; width: number; height: number }
    maxres?: { url: string; width: number; height: number }
  }
  duration: string
  channelTitle: string
  channelId: string
}

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  thumbnails: {
    default?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    high?: { url: string; width: number; height: number }
  }
}

class YouTubeAPI {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || ''
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured')
    }

    const searchParams = new URLSearchParams({
      key: this.apiKey,
      ...params
    })

    const response = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}?${searchParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`YouTube API Error: ${error.error?.message || 'Unknown error'}`)
    }

    return response.json()
  }

  async getVideo(videoId: string): Promise<YouTubeVideo> {
    const response = await this.makeRequest('videos', {
      part: 'snippet,contentDetails',
      id: videoId
    })

    if (!response.items || response.items.length === 0) {
      throw new Error('Video not found')
    }

    const item = response.items[0]
    
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnails: item.snippet.thumbnails,
      duration: item.contentDetails.duration,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId
    }
  }

  async getChannel(channelId: string): Promise<YouTubeChannel> {
    const response = await this.makeRequest('channels', {
      part: 'snippet',
      id: channelId
    })

    if (!response.items || response.items.length === 0) {
      throw new Error('Channel not found')
    }

    const item = response.items[0]
    
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnails: item.snippet.thumbnails
    }
  }

  extractVideoId(url: string): string | null {
    // Regular expressions to extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*?v=([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  extractChannelId(url: string): string | null {
    // Extract channel ID from channel URL
    const patterns = [
      /youtube\.com\/channel\/([^&\n?#]+)/,
      /youtube\.com\/c\/([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }
}

export const youtubeAPI = new YouTubeAPI()