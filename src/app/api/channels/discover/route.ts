import { NextRequest, NextResponse } from 'next/server'

// Enhanced trending/most popular channel categories for discovery
const TRENDING_CATEGORIES = [
  { name: 'Technology', terms: ['tech reviews', 'programming tutorials', 'gadgets', 'software development'] },
  { name: 'Gaming', terms: ['gaming commentary', 'game reviews', 'lets play', 'esports'] },
  { name: 'Music', terms: ['music covers', 'original music', 'music production', 'live performances'] },
  { name: 'Education', terms: ['educational content', 'online courses', 'tutorials', 'documentaries'] },
  { name: 'Comedy', terms: ['comedy sketches', 'stand up', 'funny moments', 'parody'] },
  { name: 'Science', terms: ['science experiments', 'educational science', 'space exploration', 'physics'] },
  { name: 'Cooking', terms: ['cooking shows', 'recipe tutorials', 'food reviews', 'baking'] },
  { name: 'Travel', terms: ['travel vlogs', 'destination guides', 'adventure travel', 'cultural experiences'] },
  { name: 'Fitness', terms: ['fitness workouts', 'exercise routines', 'health tips', 'nutrition'] },
  { name: 'Art', terms: ['art tutorials', 'digital art', 'painting', 'art critiques'] },
  { name: 'News', terms: ['news analysis', 'current events', 'political commentary', 'investigative journalism'] },
  { name: 'Entertainment', terms: ['movie reviews', 'tv show analysis', 'celebrity news', 'entertainment news'] },
  { name: 'Sports', terms: ['sports highlights', 'analysis', 'athlete interviews', 'sports commentary'] },
  { name: 'Fashion', terms: ['fashion tips', 'style guides', 'clothing reviews', 'beauty tutorials'] },
  { name: 'DIY', terms: ['DIY projects', 'home improvement', 'crafts', 'life hacks'] }
]

// Enhanced popular search terms for random discovery
const POPULAR_SEARCH_TERMS = [
  'tech reviews', 'gaming commentary', 'music covers', 'coding tutorials',
  'science experiments', 'comedy sketches', 'cooking shows', 'travel vlogs',
  'fitness workouts', 'art tutorials', 'news analysis', 'movie reviews',
  'sports highlights', 'fashion tips', 'DIY projects', 'book reviews',
  'podcast clips', 'productivity tips', 'language learning', 'history documentaries',
  'photography tutorials', 'car reviews', 'finance tips', 'gaming news',
  'motivational content', 'tech news', 'health advice', 'home decor'
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
    const type = searchParams.get('type') || 'random'
    const limit = parseInt(searchParams.get('limit') || '8')
    const category = searchParams.get('category')

    // Import youtubei here to avoid module loading issues
    const { Client } = await import('youtubei')
    const youtube = new Client()

    let discoveredChannels: any[] = []

    if (type === 'trending') {
      // Get trending channels from specific or random categories
      let categoriesToSearch = category 
        ? TRENDING_CATEGORIES.filter(cat => cat.name.toLowerCase() === category.toLowerCase())
        : TRENDING_CATEGORIES.slice(0, Math.min(4, Math.ceil(limit / 2)))
      
      // If no specific category found, fall back to random categories
      if (categoriesToSearch.length === 0) {
        categoriesToSearch = TRENDING_CATEGORIES
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(4, Math.ceil(limit / 2)))
      }
      
      for (const categoryInfo of categoriesToSearch) {
        try {
          // Search for the most popular term in this category
          const searchTerm = categoryInfo.terms[0]
          const searchResults = await youtube.search(`${searchTerm} channels`, { type: 'channel' })
          
          if (searchResults && searchResults.items) {
            const channels = searchResults.items.slice(0, 2).map((channel: any) => ({
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
              // Add additional metadata
              joinDate: channel.joinDate,
              country: channel.country,
              keywords: channel.keywords || [],
              tags: categoryInfo.terms
            }))
            discoveredChannels.push(...channels)
          }
        } catch (error) {
          console.error(`Error searching for ${categoryInfo.name} channels:`, error)
        }
      }
    } else if (type === 'recommended') {
      // Get recommended channels based on popular content
      const recommendedTerms = POPULAR_SEARCH_TERMS
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(8, limit))

      for (const term of recommendedTerms) {
        try {
          const searchResults = await youtube.search(term, { type: 'channel' })
          
          if (searchResults && searchResults.items) {
            const channels = searchResults.items.slice(0, 1).map((channel: any) => ({
              id: channel.id,
              name: channel.name || channel.channel?.name || 'Unknown Channel',
              description: channel.description || '',
              thumbnail: channel.thumbnail?.url || channel.avatar?.[0]?.url || '',
              subscriberCount: channel.subscriberCount || 0,
              videoCount: channel.videoCount || 0,
              searchTerm: term,
              discoveredAt: new Date().toISOString(),
              verified: getVerificationBadge(channel),
              subscriberText: formatSubscriberCount(channel.subscriberCount),
              recommendationReason: `Popular in "${term}"`,
              // Add additional metadata
              joinDate: channel.joinDate,
              country: channel.country,
              keywords: channel.keywords || []
            }))
            discoveredChannels.push(...channels)
          }
        } catch (error) {
          console.error(`Error searching for ${term}:`, error)
        }
      }
    } else {
      // Random discovery using popular search terms
      const randomTerms = POPULAR_SEARCH_TERMS
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(6, limit))

      for (const term of randomTerms) {
        try {
          const searchResults = await youtube.search(term, { type: 'channel' })
          
          if (searchResults && searchResults.items) {
            const channels = searchResults.items.slice(0, 1).map((channel: any) => ({
              id: channel.id,
              name: channel.name || channel.channel?.name || 'Unknown Channel',
              description: channel.description || '',
              thumbnail: channel.thumbnail?.url || channel.avatar?.[0]?.url || '',
              subscriberCount: channel.subscriberCount || 0,
              videoCount: channel.videoCount || 0,
              searchTerm: term,
              discoveredAt: new Date().toISOString(),
              verified: getVerificationBadge(channel),
              subscriberText: formatSubscriberCount(channel.subscriberCount),
              // Add additional metadata
              joinDate: channel.joinDate,
              country: channel.country,
              keywords: channel.keywords || []
            }))
            discoveredChannels.push(...channels)
          }
        } catch (error) {
          console.error(`Error searching for ${term}:`, error)
        }
      }
    }

    // Remove duplicates and sort by subscriber count (for more popular channels first)
    const uniqueChannels = discoveredChannels.filter((channel, index, self) => 
      index === self.findIndex((c) => c.id === channel.id)
    ).sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0))

    // Return limited number of channels
    const finalChannels = uniqueChannels.slice(0, limit)

    return NextResponse.json({
      channels: finalChannels,
      total: finalChannels.length,
      type: type,
      category: category || null,
      availableCategories: TRENDING_CATEGORIES.map(cat => cat.name),
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error discovering channels:', error)
    return NextResponse.json({ 
      error: 'Failed to discover channels',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}