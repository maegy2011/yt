import { NextRequest, NextResponse } from 'next/server'

// Predefined trending categories with multiple search terms
const TRENDING_CATEGORIES = [
  {
    name: 'Technology',
    terms: ['tech reviews', 'programming tutorials', 'gadgets', 'software development', 'AI news'],
    priority: 1
  },
  {
    name: 'Gaming',
    terms: ['gaming commentary', 'game reviews', 'lets play', 'esports', 'gaming news'],
    priority: 2
  },
  {
    name: 'Music',
    terms: ['music covers', 'original music', 'music production', 'live performances', 'music tutorials'],
    priority: 3
  },
  {
    name: 'Education',
    terms: ['educational content', 'online courses', 'tutorials', 'documentaries', 'learning'],
    priority: 4
  },
  {
    name: 'Comedy',
    terms: ['comedy sketches', 'stand up', 'funny moments', 'parody', 'comedy commentary'],
    priority: 5
  },
  {
    name: 'Science',
    terms: ['science experiments', 'educational science', 'space exploration', 'physics', 'chemistry'],
    priority: 6
  }
]

// Function to format subscriber count
function formatSubscriberCount(count: number | undefined): string {
  if (!count || count === 0) return 'No subscribers'
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M subscribers`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K subscribers`
  }
  return `${count} subscribers`
}

// Function to get channel verification badge
function getVerificationBadge(channel: any): boolean {
  return channel.verified || channel.badges?.some((badge: any) => badge.type === 'VERIFIED_CHANNEL')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')

    // Import youtubei here to avoid module loading issues
    const { Client } = await import('youtubei')
    const youtube = new Client()

    let trendingChannels: any[] = []

    // If specific category requested, search only that category
    if (category) {
      const categoryInfo = TRENDING_CATEGORIES.find(cat => 
        cat.name.toLowerCase() === category.toLowerCase()
      )
      
      if (categoryInfo) {
        await searchCategory(categoryInfo, limit, youtube, trendingChannels)
      }
    } else {
      // Get trending channels from all categories
      const channelsPerCategory = Math.ceil(limit / TRENDING_CATEGORIES.length)
      
      for (const categoryInfo of TRENDING_CATEGORIES) {
        await searchCategory(categoryInfo, channelsPerCategory, youtube, trendingChannels)
      }
    }

    // Sort by subscriber count (most popular first) and limit results
    const sortedChannels = trendingChannels
      .sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0))
      .slice(0, limit)

    return NextResponse.json({
      channels: sortedChannels,
      total: sortedChannels.length,
      category: category || 'all',
      availableCategories: TRENDING_CATEGORIES.map(cat => cat.name),
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting trending channels:', error)
    return NextResponse.json({ 
      error: 'Failed to get trending channels',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function searchCategory(
  categoryInfo: any, 
  limit: number, 
  youtube: any, 
  trendingChannels: any[]
) {
  try {
    // Search for multiple terms in this category to get better results
    const searchTerms = categoryInfo.terms.slice(0, 3)
    
    for (const term of searchTerms) {
      try {
        const searchResults = await youtube.search(`${term} channels`, { 
          type: 'channel',
          limit: Math.ceil(limit / searchTerms.length)
        })
        
        if (searchResults && searchResults.items) {
          const channels = searchResults.items.map((channel: any) => ({
            id: channel.id,
            name: channel.name || channel.channel?.name || 'Unknown Channel',
            description: channel.description || '',
            thumbnail: channel.thumbnail?.url || channel.avatar?.[0]?.url || '',
            subscriberCount: channel.subscriberCount || 0,
            videoCount: channel.videoCount || 0,
            category: categoryInfo.name,
            discoveredAt: new Date().toISOString(),
            verified: getVerificationBadge(channel),
            subscriberText: formatSubscriberCount(channel.subscriberCount),
            priority: categoryInfo.priority,
            searchTerm: term,
            // Additional metadata
            joinDate: channel.joinDate,
            country: channel.country,
            keywords: channel.keywords || [],
            tags: categoryInfo.terms
          }))
          
          trendingChannels.push(...channels)
        }
      } catch (error) {
        console.error(`Error searching for ${term} in ${categoryInfo.name}:`, error)
      }
    }
  } catch (error) {
    console.error(`Error searching category ${categoryInfo.name}:`, error)
  }
}