import { NextRequest, NextResponse } from 'next/server'

// Helper function to extract thumbnail URL from YouTubei v1.8.0 Thumbnails API
function extractThumbnail(thumbnails: any): { url: string; width: number; height: number } {
  if (!thumbnails) {
    return {
      url: `https://via.placeholder.com/320x180/374151/ffffff?text=No+Thumbnail`,
      width: 320,
      height: 180
    }
  }

  // Handle YouTubei v1.8.0 Thumbnails object (has .best property)
  if (thumbnails.best && typeof thumbnails.best === 'string') {
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
  if (thumbnails.url) {
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

    // Fetching OpenAI content 
      maxVideos, 
      maxPlaylists, 
      includePlaylists, 
      videoPage, 
      playlistPage, 
      videosPerPage, 
      playlistsPerPage 
    })

    const { Client } = await import('youtubei')
    const youtube = new Client()

    const allVideos: any[] = []
    const allPlaylists: any[] = []
    const channelsInfo: any[] = []

    try {
      // Search for OpenAI videos directly
      // 'Searching for OpenAI videos...')
      const videoSearch = await youtube.search('OpenAI official', { type: 'video' })
      
      if (videoSearch && videoSearch.items && videoSearch.items.length > 0) {
        const videos = videoSearch.items.slice(0, maxVideos).map((video: any) => {
          // Extract channel info from video
          const channelInfo = {
            id: video.channel?.id || '',
            name: video.channel?.name || 'OpenAI',
            thumbnail: video.channel?.thumbnails ? extractThumbnail(video.channel.thumbnails) : { url: '', width: 0, height: 0 }
          }
          
          // Add channel to channels list if not already present
          if (!channelsInfo.find(c => c.id === channelInfo.id) && channelInfo.name.toLowerCase().includes('openai')) {
            channelsInfo.push({
              id: channelInfo.id,
              name: channelInfo.name,
              description: 'Official OpenAI channel',
              thumbnail: channelInfo.thumbnail,
              subscriberCount: 0,
              videoCount: 0,
              url: `https://youtube.com/channel/${channelInfo.id}`,
              handle: '@openai'
            })
          }
          
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
            channelId: channelInfo.id,
            channelName: channelInfo.name,
            channelThumbnail: channelInfo.thumbnail.url,
            isLive: video.isLive || false,
            isUpcoming: video.isUpcoming || false,
            upcomingDate: video.upcomingDate,
            stats: {
              views: video.viewCount || 0,
              likes: video.likeCount || 0,
              comments: video.commentCount || 0
            }
          }
        })
        
        allVideos.push(...videos)
        // `Found ${videos.length} OpenAI videos`)
      }
    } catch (error) {
      // 'Error searching for OpenAI videos:', error)
    }

    try {
      // Search for OpenAI playlists if requested
      if (includePlaylists) {
        // 'Searching for OpenAI playlists...')
        const playlistSearch = await youtube.search('OpenAI official', { type: 'playlist' })
        
        if (playlistSearch && playlistSearch.items && playlistSearch.items.length > 0) {
          const playlists = playlistSearch.items.slice(0, maxPlaylists).map((playlist: any) => {
            // Fix invalid dates
            let lastUpdatedAt = playlist.lastUpdatedAt
            if (lastUpdatedAt) {
              try {
                const date = new Date(lastUpdatedAt)
                if (isNaN(date.getTime())) {
                  // If invalid date, use current date
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
              channelId: playlist.channel?.id || '',
              channelName: playlist.channel?.name || 'OpenAI',
              channelThumbnail: playlist.channel?.thumbnails ? extractThumbnail(playlist.channel.thumbnails).url : ''
            }
          })
          
          allPlaylists.push(...playlists)
          // `Found ${playlists.length} OpenAI playlists`)
        }
      }
    } catch (error) {
      // 'Error searching for OpenAI playlists:', error)
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
        source: 'OpenAI Content Search',
        maxVideosPerChannel: maxVideos,
        maxPlaylistsPerChannel: maxPlaylists
      }
    }

    // 'OpenAI content fetched successfully:', {
      channels: response.stats.totalChannels,
      videos: response.stats.totalVideos,
      playlists: response.stats.totalPlaylists,
      videoPage: videoPage,
      playlistPage: playlistPage
    })

    return NextResponse.json(response)

  } catch (error) {
    // 'Failed to fetch OpenAI content:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch OpenAI content',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}