import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Use dynamic import for youtubei to avoid module resolution issues
let Client: any
let youtubei: any

const initializeYoutubei = async () => {
  try {
    const youtubeiModule = await import('youtubei')
    youtubei = youtubeiModule.default || youtubeiModule
    Client = youtubei.Client || youtubeiModule.Client
    // 'YouTubei initialized successfully for followed channels')
  } catch (error) {
    // 'Failed to initialize YouTubei for followed channels:', error)
  }
}

// Initialize immediately
initializeYoutubei().catch(() => {})

// Helper function to extract thumbnail URL from YouTubei v1.8.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  try {
    if (!thumbnails) {
      return {
        url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
        width: 320,
        height: 180
      }
    }

    // Handle YouTubei v1.8.0 Thumbnails object (has .best property)
    if (thumbnails && typeof thumbnails === 'object' && thumbnails.best && typeof thumbnails.best === 'string') {
      return {
        url: thumbnails.best,
        width: 1280,
        height: 720
      }
    }

    // Handle YouTubei v1.8.0 Thumbnails array
    if (Array.isArray(thumbnails) && thumbnails.length > 0) {
      const bestThumbnail = thumbnails[thumbnails.length - 1]
      if (bestThumbnail && bestThumbnail.url) {
        return {
          url: bestThumbnail.url,
          width: bestThumbnail.width || 1280,
          height: bestThumbnail.height || 720
        }
      }
    }

    // Handle single thumbnail object
    if (thumbnails && thumbnails.url) {
      return {
        url: thumbnails.url,
        width: thumbnails.width || 320,
        height: thumbnails.height || 180
      }
    }

    // Handle string URL
    if (typeof thumbnails === 'string') {
      return {
        url: thumbnails,
        width: 320,
        height: 180
      }
    }

    // Fallback
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
      width: 320,
      height: 180
    }
  } catch (error) {
    console.error('Error extracting thumbnail:', error)
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=Error`,
      width: 320,
      height: 180
    }
  }
}

// Helper function to check if content should be filtered
function shouldFilterContent(content: any, blacklistedItems: any[], whitelistedItems: any[]) {
  const contentType = content.videoId ? 'video' : content.id ? 'playlist' : 'channel'
  const contentId = content.videoId || content.id || content.channelId
  
  // Check whitelist first (whitelist takes precedence)
  if (whitelistedItems.length > 0) {
    const isWhitelisted = whitelistedItems.some(item => {
      if (item.type === contentType && item.itemId === contentId) {
        return true
      }
      // For videos, also check if from whitelisted channel
      if (contentType === 'video' && item.type === 'channel' && item.itemId === content.channelId) {
        return true
      }
      return false
    })
    
    // If whitelist exists but content is not whitelisted, filter it out
    return !isWhitelisted
  }
  
  // Check blacklist
  if (blacklistedItems.length > 0) {
    const isBlacklisted = blacklistedItems.some(item => {
      if (item.type === contentType && item.itemId === contentId) {
        return true
      }
      // For videos, also check if from blocked channel
      if (contentType === 'video' && item.type === 'channel' && item.itemId === content.channelId) {
        return true
      }
      return false
    })
    
    // Filter out blacklisted content
    return isBlacklisted
  }
  
  // No filtering needed
  return false
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const maxVideos = parseInt(searchParams.get('maxVideos') || '20')
    const maxPlaylists = parseInt(searchParams.get('maxPlaylists') || '10')
    const includePlaylists = searchParams.get('includePlaylists') !== 'false'
    const videoPage = parseInt(searchParams.get('videoPage') || '1')
    const playlistPage = parseInt(searchParams.get('playlistPage') || '1')
    const videosPerPage = parseInt(searchParams.get('videosPerPage') || '12')
    const playlistsPerPage = parseInt(searchParams.get('playlistsPerPage') || '6')

    // 'Fetching followed channels content:', { 
      maxVideos, 
      maxPlaylists, 
      includePlaylists, 
      videoPage, 
      playlistPage, 
      videosPerPage, 
      playlistsPerPage 
    })

    // Get all favorite channels from database
    const favoriteChannels = await db.favoriteChannel.findMany({
      orderBy: { addedAt: 'desc' }
    })

    // Get blacklist and whitelist items for filtering
    const [blacklistedItems, whitelistedItems] = await Promise.all([
      db.blacklistedItem.findMany(),
      db.whitelistedItem.findMany()
    ])

    // 'Loaded blacklist/whitelist items:', {
      blacklisted: blacklistedItems.length,
      whitelisted: whitelistedItems.length
    })

    if (favoriteChannels.length === 0) {
      return NextResponse.json({
        channels: [],
        videos: [],
        playlists: [],
        pagination: {
          videos: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: videosPerPage,
            hasNextPage: false,
            hasPreviousPage: false
          },
          playlists: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: playlistsPerPage,
            hasNextPage: false,
            hasPreviousPage: false
          }
        },
        stats: {
          totalChannels: 0,
          totalVideos: 0,
          totalPlaylists: 0,
          totalViews: 0,
          totalSubscribers: 0
        },
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'Followed Channels Content',
          message: 'No channels found. Add some channels to your favorites to see their content here.'
        }
      })
    }

  if (!Client) {
    return NextResponse.json({ error: 'YouTube client not initialized' }, { status: 500 })
  }
  const youtube = new Client()

    const allVideos: any[] = []
    const allPlaylists: any[] = []
    const channelsInfo: any[] = []

    // Process each favorite channel
    for (const channel of favoriteChannels) {
      try {
        // `Processing channel: ${channel.name} (${channel.channelId})`)
        
        // Get channel info
        const channelData = await youtube.getChannel(channel.channelId)
        
        if (channelData) {
          // Add channel info
          channelsInfo.push({
            id: channelData.id,
            name: channelData.name,
            description: channelData.description || '',
            thumbnail: (channelData as any).thumbnail ? extractThumbnail((channelData as any).thumbnail) : ((channelData as any).thumbnails ? extractThumbnail((channelData as any).thumbnails[0]) : { url: channel.thumbnail || '', width: 0, height: 0 }),
            subscriberCount: channelData.subscriberCount || 0,
            videoCount: channelData.videoCount || 0,
            url: `https://youtube.com/channel/${channelData.id}`,
            handle: channelData.handle || `@${channelData.name.toLowerCase().replace(/\s+/g, '')}`,
            addedAt: channel.addedAt
          })

          // Search for videos from this channel
          try {
            // `Searching for videos from ${channel.name}...`)
            
            // Add retry logic for YouTube API calls
            let videoSearch = null
            let retries = 0
            const maxRetries = 3
            
            while (retries < maxRetries && !videoSearch) {
              try {
                videoSearch = await youtube.search(channel.name, { type: 'video' })
                
                if (videoSearch && videoSearch.items && videoSearch.items.length > 0) {
                  console.warn(`Successfully found ${videoSearch.items.length} videos from ${channel.name} on attempt ${retries + 1}`)
                  break
                } else if (retries === maxRetries - 1) {
                console.warn(`No videos found for ${channel.name} after ${maxRetries} attempts`)
                  break
                }
              } catch (searchError) {
                console.warn(`Search attempt ${retries + 1} failed for ${channel.name}:`, searchError.message)
                if (retries === maxRetries - 1) {
                  console.warn(`Max retries reached for ${channel.name}, continuing without videos`)
                  break
                }
              }
              retries++
              
              // Add delay between retries
              if (retries < maxRetries && !videoSearch) {
                await new Promise(resolve => setTimeout(resolve, 1000 * retries)) // Exponential backoff
              }
            }
            
            if (videoSearch && videoSearch.items && videoSearch.items.length > 0) {
              const videos = videoSearch.items.slice(0, maxVideos).map((video: any) => {
                // Only include videos from this specific channel
                if (video.channel?.id !== channel.channelId) return null
                
                // Use uploadDate from YouTubei API directly, fallback to publishedAt
                let publishedAt = video.uploadDate || video.publishedAt
                
                // Only try to parse as ISO date if it looks like an ISO date
                if (publishedAt && (publishedAt.includes('T') || publishedAt.includes('-'))) {
                  try {
                    const date = new Date(publishedAt)
                    if (isNaN(date.getTime())) {
                      // If it's not a valid ISO date, keep the original relative format
                      publishedAt = video.uploadDate || video.publishedAt || 'Unknown date'
                    }
                  } catch (error) {
                    // Keep the original relative format if parsing fails
                    publishedAt = video.uploadDate || video.publishedAt || 'Unknown date'
                  }
                } else if (!publishedAt) {
                  publishedAt = 'Unknown date'
                }
                
                return {
                  id: video.id,
                  videoId: video.id,
                  title: video.title,
                  description: video.description,
                  thumbnail: extractThumbnail(video.thumbnails),
                  duration: video.duration,
                  viewCount: video.viewCount || 0,
                  publishedAt: publishedAt,
                  channelId: channelData.id,
                  channelName: channelData.name,
                  channelThumbnail: (channelData as any).thumbnail ? extractThumbnail((channelData as any).thumbnail).url : ((channelData as any).thumbnails ? extractThumbnail((channelData as any).thumbnails[0]).url : channel.thumbnail || ''),
                  isLive: video.isLive || false,
                  isUpcoming: video.isUpcoming || false,
                  upcomingDate: video.upcomingDate,
                  stats: {
                    views: video.viewCount || 0,
                    likes: video.likeCount || 0,
                    comments: video.commentCount || 0
                  }
                }
              }).filter(video => video !== null) // Remove null entries
              
              // Apply blacklist/whitelist filtering to videos
              const filteredVideos = videos.filter(video => !shouldFilterContent(video, blacklistedItems, whitelistedItems))
              
              allVideos.push(...filteredVideos)
              // `Found ${videos.length} videos (${filteredVideos.length} after filtering) from ${channel.name}`)
            }
          } catch (videoError) {
            // `Error searching for videos from ${channel.name}:`, videoError)
          }

          // Search for playlists from this channel if requested
          if (includePlaylists) {
            try {
              // `Searching for playlists from ${channel.name}...`)
              
              // Add retry logic for YouTube API calls
              let playlistSearch = null
              let retries = 0
              const maxRetries = 3
              
              while (retries < maxRetries && !playlistSearch) {
                try {
                  playlistSearch = await youtube.search(channel.name, { type: 'playlist' })
                  
                  if (playlistSearch && playlistSearch.items && playlistSearch.items.length > 0) {
                    // `Successfully found ${playlistSearch.items.length} playlists from ${channel.name} on attempt ${retries + 1}`)
                    break
                  } else if (retries === maxRetries - 1) {
                    // `No playlists found for ${channel.name} after ${maxRetries} attempts`)
                    break
                  }
                } catch (searchError) {
                  // `Playlist search attempt ${retries + 1} failed for ${channel.name}:`, searchError.message)
                  if (retries === maxRetries - 1) {
                    // `Max retries reached for ${channel.name}, continuing without playlists`)
                    break
                  }
                }
                retries++
                
                // Add delay between retries
                if (retries < maxRetries && !playlistSearch) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * retries)) // Exponential backoff
                }
              }
              
              if (playlistSearch && playlistSearch.items && playlistSearch.items.length > 0) {
                const playlists = playlistSearch.items.slice(0, maxPlaylists).map((playlist: any) => {
                  // Only include playlists from this specific channel
                  if (playlist.channel?.id !== channel.channelId) return null
                  
                  // Fix invalid dates
                  let lastUpdatedAt = playlist.lastUpdatedAt
                  if (lastUpdatedAt) {
                    try {
                      const date = new Date(lastUpdatedAt)
                      if (isNaN(date.getTime())) {
                        lastUpdatedAt = new Date().toISOString()
                      }
                    } catch (error) {
                      lastUpdatedAt = new Date().toISOString()
                    }
                  } else {
                    lastUpdatedAt = new Date().toISOString()
                  }
                  
                  return {
                    id: playlist.id,
                    title: playlist.title,
                    description: playlist.description,
                    thumbnail: extractThumbnail(playlist.thumbnails),
                    videoCount: playlist.videoCount || 0,
                    viewCount: playlist.viewCount || 0,
                    lastUpdatedAt: lastUpdatedAt,
                    channelId: channelData.id,
                    channelName: channelData.name,
                    channelThumbnail: (channelData as any).thumbnail ? extractThumbnail((channelData as any).thumbnail).url : ((channelData as any).thumbnails ? extractThumbnail((channelData as any).thumbnails[0]).url : channel.thumbnail || '')
                  }
                }).filter(playlist => playlist !== null) // Remove null entries
                
                // Apply blacklist/whitelist filtering to playlists
                const filteredPlaylists = playlists.filter(playlist => !shouldFilterContent(playlist, blacklistedItems, whitelistedItems))
                
                allPlaylists.push(...filteredPlaylists)
                // `Found ${playlists.length} playlists (${filteredPlaylists.length} after filtering) from ${channel.name}`)
              }
            } catch (playlistError) {
              // `Error searching for playlists from ${channel.name}:`, playlistError)
            }
          }
        }
      } catch (error) {
        // `Error processing channel ${channel.name}:`, error)
        // Continue with other channels even if one fails
      }
    }

    // Sort videos by published date (newest first)
    // Only sort if dates are in ISO format, otherwise keep YouTubei's natural ordering
    allVideos.sort((a, b) => {
      const aDate = a.publishedAt
      const bDate = b.publishedAt
      
      // If both are ISO dates, sort by timestamp
      if (aDate.includes('T') && bDate.includes('T')) {
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }
      
      // If one is ISO and one is relative, prioritize ISO (more recent)
      if (aDate.includes('T') && !bDate.includes('T')) return -1
      if (!aDate.includes('T') && bDate.includes('T')) return 1
      
      // If both are relative or both are unknown, keep original order
      return 0
    })

    // Sort playlists by last updated date (newest first)
    allPlaylists.sort((a, b) => new Date(b.lastUpdatedAt || 0).getTime() - new Date(a.lastUpdatedAt || 0).getTime())

    // Pagination for videos
    const totalVideos = allVideos.length
    const videoStartIndex = (videoPage - 1) * videosPerPage
    const videoEndIndex = videoStartIndex + videosPerPage
    const paginatedVideos = allVideos.slice(videoStartIndex, videoEndIndex)
    const hasMoreVideos = videoEndIndex < totalVideos

    // Pagination for playlists
    const totalPlaylists = allPlaylists.length
    const playlistStartIndex = (playlistPage - 1) * playlistsPerPage
    const playlistEndIndex = playlistStartIndex + playlistsPerPage
    const paginatedPlaylists = allPlaylists.slice(playlistStartIndex, playlistEndIndex)
    const hasMorePlaylists = playlistEndIndex < totalPlaylists

    const response = {
      channels: channelsInfo,
      videos: paginatedVideos,
      playlists: paginatedPlaylists,
      pagination: {
        videos: {
          currentPage: videoPage,
          totalPages: Math.ceil(totalVideos / videosPerPage),
          totalItems: totalVideos,
          itemsPerPage: videosPerPage,
          hasNextPage: hasMoreVideos,
          hasPreviousPage: videoPage > 1
        },
        playlists: {
          currentPage: playlistPage,
          totalPages: Math.ceil(totalPlaylists / playlistsPerPage),
          totalItems: totalPlaylists,
          itemsPerPage: playlistsPerPage,
          hasNextPage: hasMorePlaylists,
          hasPreviousPage: playlistPage > 1
        }
      },
      stats: {
        totalChannels: channelsInfo.length,
        totalVideos: totalVideos,
        totalPlaylists: totalPlaylists,
        totalViews: allVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0),
        totalSubscribers: channelsInfo.reduce((sum, channel) => sum + (channel.subscriberCount || 0), 0)
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'Followed Channels Content',
        maxVideosPerChannel: maxVideos,
        maxPlaylistsPerChannel: maxPlaylists
      }
    }

    // 'Followed channels content fetched successfully:', {
      channels: response.stats.totalChannels,
      videos: response.stats.totalVideos,
      playlists: response.stats.totalPlaylists,
      videoPage: videoPage,
      playlistPage: playlistPage
    })

    return NextResponse.json(response)

  } catch (error) {
    // 'Failed to fetch followed channels content:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch followed channels content',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}