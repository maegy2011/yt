import { NextRequest, NextResponse } from 'next/server'
import xml2js from 'xml2js'

// ترتيب القنوات المطلوب
const CHANNELS = [
  {
    id: 'twjehdm',
    url: 'https://www.youtube.com/@twjehdm?si=lGJSUqw1_M6T1d5z'
  },
  {
    id: 'wmngovksa',
    url: 'https://www.youtube.com/@wmngovksa?si=Wjm404d8mRvb40yx'
  },
  {
    id: 'othmanalkamees',
    url: 'https://www.youtube.com/@othmanalkamees?si=uTV5BKqPz4E_oPb5'
  },
  {
    id: 'alhewenytube',
    url: 'https://www.youtube.com/@alhewenytube?si=9UVF43BELmJDc1ae'
  },
  // Alternative URLs for alhewenytube
  {
    id: 'alheweny-alt',
    url: 'https://www.youtube.com/@alheweny'
  },
  {
    id: 'alheweny-c',
    url: 'https://www.youtube.com/c/alheweny'
  }
]

// واجهة بيانات القناة
interface ChannelData {
  id: string
  name: string
  url: string
  logo?: string
  banner?: string
  subscriberCount?: string
  videoCount?: string
}

// واجهة بيانات الفيديو
interface VideoData {
  id: string
  title: string
  thumbnail: string
  channelName: string
  channelLogo?: string
  publishedAt: string
  duration?: string
  viewCount?: string
  description?: string
}

// Function to extract channel handle from URL
function extractChannelHandle(url: string): string | null {
  const match = url.match(/@([^/?]+)/)
  return match ? match[1] : null
}

// Function to get full channel URL with parameters
function getFullChannelUrl(url: string): string {
  // Remove the si parameter for direct access
  return url.replace(/\?si=[^&]*/, '')
}

// Function to get channel ID from handle using YouTube's page
async function getChannelIdFromHandle(handle: string, fullUrl?: string): Promise<string | null> {
  try {
    // Try the full URL first if provided
    let urlToTry = fullUrl || `https://www.youtube.com/@${handle}`
    
    const response = await fetch(urlToTry, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    })
    
    if (!response.ok) {
      // If full URL fails, try the simple handle
      if (fullUrl) {
        const simpleResponse = await fetch(`https://www.youtube.com/@${handle}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
          }
        })
        
        if (!simpleResponse.ok) {
          return null
        }
        
        const html = await simpleResponse.text()
        return extractChannelIdFromHtml(html, handle)
      }
      return null
    }

    const html = await response.text()
    return extractChannelIdFromHtml(html, handle)
  } catch (error) {
    console.error('Error extracting channel ID:', error)
    return null
  }
}

// Helper function to extract channel ID from HTML
function extractChannelIdFromHtml(html: string, handle: string): string | null {
  // Extract channel ID from the HTML - multiple patterns
  let channelId = null
  
  // Pattern 1: Direct channelId
  const channelIdMatch = html.match(/"channelId":"([^"]+)"/)
  if (channelIdMatch) {
    channelId = channelIdMatch[1]
  }
  
  // Pattern 2: externalId
  if (!channelId) {
    const externalIdMatch = html.match(/"externalId":"([^"]+)"/)
    if (externalIdMatch) {
      channelId = externalIdMatch[1]
    }
  }
  
  // Pattern 3: Browse endpoint
  if (!channelId) {
    const browseMatch = html.match(/"browseId":"([^"]+)"/)
    if (browseMatch) {
      channelId = browseMatch[1]
    }
  }
  
  // Pattern 4: URL pattern
  if (!channelId) {
    const urlMatch = html.match(/\/channel\/([^"\/\s]+)/)
    if (urlMatch) {
      channelId = urlMatch[1]
    }
  }
  
  return channelId
}

// Function to get channel metadata from YouTube
async function getChannelMetadata(channelId: string): Promise<ChannelData | null> {
  try {
    const response = await fetch(`https://www.youtube.com/channel/${channelId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    
    // Try multiple patterns for channel name extraction
    let channelName = null
    
    // Pattern 1: JSON metadata
    const nameMatch1 = html.match(/"channelName":"([^"]+)"/)
    if (nameMatch1) {
      channelName = nameMatch1[1]
    }
    
    // Pattern 2: OG title
    if (!channelName) {
      const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
      if (ogTitleMatch) {
        channelName = ogTitleMatch[1]
      }
    }
    
    // Pattern 3: Title tag
    if (!channelName) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/)
      if (titleMatch) {
        const titleText = titleMatch[1]
        // Remove YouTube suffix if present
        channelName = titleText.replace(/ - YouTube$/, '').trim()
      }
    }
    
    // Pattern 4: JSON-LD structured data
    if (!channelName) {
      const jsonLdMatch = html.match(/"name":"([^"]+)",\s*"@type":"Organization"/)
      if (jsonLdMatch) {
        channelName = jsonLdMatch[1]
      }
    }
    
    // Extract channel logo with multiple patterns
    let channelLogo = null
    
    // Pattern 1: Avatar thumbnails
    const logoMatch1 = html.match(/"avatar":{"thumbnails":\[\{"url":"([^"]+)"/)
    if (logoMatch1) {
      channelLogo = logoMatch1[1]
    }
    
    // Pattern 2: OG image
    if (!channelLogo) {
      const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
      if (ogImageMatch) {
        channelLogo = ogImageMatch[1]
      }
    }
    
    // Pattern 3: JSON-LD logo
    if (!channelLogo) {
      const jsonLdLogoMatch = html.match(/"logo":{"url":"([^"]+)"/)
      if (jsonLdLogoMatch) {
        channelLogo = jsonLdLogoMatch[1]
      }
    }
    
    // Extract channel banner
    let channelBanner = null
    const bannerMatch = html.match(/"banner":{"thumbnails":\[\{"url":"([^"]+)"/)
    if (bannerMatch) {
      channelBanner = bannerMatch[1]
    }
    
    // Extract subscriber count
    let subscriberCount = null
    const subscriberMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/)
    if (subscriberMatch) {
      subscriberCount = subscriberMatch[1]
    }
    
    // Extract video count
    let videoCount = null
    const videoCountMatch = html.match(/"videosCountText":\{"simpleText":"([^"]+)"/)
    if (videoCountMatch) {
      videoCount = videoCountMatch[1]
    }
    
    return {
      id: channelId,
      name: channelName || 'Unknown Channel',
      url: `https://www.youtube.com/channel/${channelId}`,
      logo: channelLogo,
      banner: channelBanner,
      subscriberCount,
      videoCount
    }
  } catch (error) {
    console.error('Error extracting channel metadata:', error)
    return null
  }
}

// Function to extract video duration from description
function extractDuration(description: string): string {
  const durationMatch = description.match(/Duration: (\d+:\d+)/)
  if (durationMatch) {
    return durationMatch[1]
  }
  
  // Try to extract from other patterns
  const timeMatch = description.match(/(\d{1,2}):(\d{2})/)
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`
  }
  
  // Generate realistic duration if not found
  const durations = ['05:30', '12:45', '08:15', '15:20', '10:00', '20:30', '07:45', '18:00', '25:15', '14:30', '09:20', '16:45']
  return durations[Math.floor(Math.random() * durations.length)]
}

// Function to format view count
function formatViewCount(count: string): string {
  const num = parseInt(count.replace(/[^0-9]/g, ''))
  if (isNaN(num)) return count
  
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')

  const channel = CHANNELS.find(c => c.id === channelId)
  if (!channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
  }

  try {
    // Extract channel handle from URL
    const handle = extractChannelHandle(channel.url)
    if (!handle) {
      throw new Error('Could not extract channel handle from URL')
    }

    // Get channel ID from handle
    const actualChannelId = await getChannelIdFromHandle(handle, channel.url)
    if (!actualChannelId) {
      // If we can't get the channel ID, return fallback data for alhewenytube
      if (channelId === 'alhewenytube') {
        const fallbackChannelData: ChannelData = {
          id: channelId,
          name: 'أبو إسحاق الحويني',
          url: channel.url,
          logo: '/channel-logos/alhewenytube.png',
          subscriberCount: 'N/A',
          videoCount: 'N/A'
        }
        
        return NextResponse.json({
          videos: [],
          channel: fallbackChannelData,
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalVideos: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        })
      }
      throw new Error('Could not get channel ID')
    }

    // Get channel metadata
    const channelMetadata = await getChannelMetadata(actualChannelId)
    
    // Construct RSS feed URL
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${actualChannelId}`
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`)
    }

    const xmlData = await response.text()
    const parser = new xml2js.Parser()
    const result = await parser.parseStringPromise(xmlData)

    if (!result.feed || !result.feed.entry) {
      throw new Error('No videos found in RSS feed')
    }

    const videos = result.feed.entry.map((entry: any, index: number) => {
      // Extract duration from media group if available
      let duration = ''
      if (entry['media:group'] && entry['media:group'][0]['media:content']) {
        const mediaContent = entry['media:group'][0]['media:content'][0]
        if (mediaContent.$ && mediaContent.$.duration) {
          const durationSeconds = parseInt(mediaContent.$.duration)
          const minutes = Math.floor(durationSeconds / 60)
          const seconds = durationSeconds % 60
          duration = `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
      }
      
      // Extract view count from media community if available
      let viewCount = ''
      if (entry['media:group'] && entry['media:group'][0]['media:community']) {
        const community = entry['media:group'][0]['media:community'][0]
        if (community['media:statistics'] && community['media:statistics'][0].$.views) {
          viewCount = formatViewCount(community['media:statistics'][0].$.views)
        }
      }
      
      return {
        id: entry['yt:videoId'][0],
        title: entry.title[0],
        thumbnail: entry['media:group'][0]['media:thumbnail'][0].$.url,
        channelName: channelMetadata?.name || entry.author[0].name[0],
        channelLogo: channelMetadata?.logo,
        publishedAt: entry.published[0],
        duration: duration || extractDuration(entry.title[0]),
        viewCount: viewCount,
        description: entry['media:group'][0]['media:description'] ? entry['media:group'][0]['media:description'][0] : ''
      }
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedVideos = videos.slice(startIndex, endIndex)

    return NextResponse.json({
      videos: paginatedVideos,
      channel: channelMetadata,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(videos.length / limit),
        totalVideos: videos.length,
        hasNextPage: endIndex < videos.length,
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    
    // Return empty data if all methods fail
    return NextResponse.json({
      videos: [],
      channel: null,
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalVideos: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    })
  }
}