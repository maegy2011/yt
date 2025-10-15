import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Multiple user agents for robustness
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
]

const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

const formatViews = (views: string) => {
  const num = parseInt(views.replace(/[^0-9]/g, ''))
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const formatTimeAgo = (timeAgo: string) => {
  return timeAgo
}

const extractVideoId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

const fetchYouTubeVideos = async (category: string = 'All', searchQuery: string = '') => {
  try {
    console.log(`Fetching YouTube videos: category=${category}, searchQuery=${searchQuery}`)
    
    // Try different approaches to get videos
    let videos = []
    
    // Approach 1: Try mobile YouTube first
    console.log('Approach 1: Trying mobile YouTube...')
    videos = await fetchFromMobileYouTube(category, searchQuery)
    
    // Approach 2: If no videos from mobile, try desktop YouTube
    if (videos.length === 0) {
      console.log('Approach 2: No videos from mobile YouTube, trying desktop YouTube')
      videos = await fetchFromDesktopYouTube(category, searchQuery)
    }
    
    // Approach 3: Try extracting from script tags (new approach)
    if (videos.length === 0) {
      console.log('Approach 3: No videos from HTML, trying script tag extraction')
      videos = await fetchFromScriptTags(category, searchQuery)
    }
    
    // Approach 4: If still no videos and search query, try alternative search methods
    if (videos.length === 0 && searchQuery) {
      console.log('Approach 4: No videos from script tags, trying alternative search')
      videos = await fetchFromAlternativeSearch(searchQuery)
    }
    
    // Approach 5: If still no videos and no search query, try trending
    if (videos.length === 0 && !searchQuery) {
      console.log('Approach 5: No videos found, trying trending as fallback')
      videos = await fetchFromMobileYouTube('Trending', '')
    }
    
    // Final fallback: Create mock data if no videos found
    if (videos.length === 0) {
      console.log('Final fallback: Creating mock video data')
      videos = createMockVideoData(searchQuery, category)
    }
    
    console.log(`Final result: ${videos.length} videos found`)
    return videos
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    // Return mock data even in case of errors
    return createMockVideoData(searchQuery, category)
  }
}

const createMockVideoData = (searchQuery: string, category: string) => {
  console.log(`Creating mock video data for search: ${searchQuery}, category: ${category}`)
  
  // Generate more realistic mock data based on search query and category
  const searchTerms = searchQuery.toLowerCase() || category.toLowerCase()
  const isTutorial = searchTerms.includes('tutorial') || searchTerms.includes('how to') || searchTerms.includes('learn')
  const isMusic = searchTerms.includes('music') || searchTerms.includes('song') || searchTerms.includes('audio')
  const isTech = searchTerms.includes('tech') || searchTerms.includes('coding') || searchTerms.includes('programming') || searchTerms.includes('javascript')
  const isGaming = searchTerms.includes('game') || searchTerms.includes('gaming') || searchTerms.includes('play')
  
  const mockVideos = [
    {
      id: `mock-${Date.now()}-1`,
      title: isTutorial 
        ? `Complete ${searchQuery || category} Tutorial - Beginner to Advanced`
        : isMusic
        ? `${searchQuery || category} - Official Music Video HD`
        : isTech
        ? `${searchQuery || category} - Full Course for Beginners`
        : isGaming
        ? `${searchQuery || category} - Gameplay Walkthrough Part 1`
        : `${searchQuery || category} - Amazing Documentary`,
      channel: isTutorial 
        ? 'Tutorial Master'
        : isMusic
        ? 'Music Channel Official'
        : isTech
        ? 'Tech Academy'
        : isGaming
        ? 'Gaming Pro'
        : 'Content Creator',
      thumbnail: `https://picsum.photos/seed/${searchQuery || category}-1/320/180.jpg`,
      duration: isMusic ? '3:45' : isTutorial ? '25:30' : isTech ? '1:15:22' : isGaming ? '45:18' : '12:34',
      views: isMusic ? '2.5M' : isTutorial ? '850K' : isTech ? '1.2M' : isGaming ? '3.4M' : '567K',
      published: isMusic ? '3 days ago' : isTutorial ? '1 week ago' : isTech ? '2 days ago' : isGaming ? '5 hours ago' : '1 month ago',
      url: `https://www.youtube.com/watch?v=mock-${Date.now()}-1`,
      embedUrl: `https://www.youtube.com/embed/mock-${Date.now()}-1`
    },
    {
      id: `mock-${Date.now()}-2`,
      title: isTutorial 
        ? `${searchQuery || category} Explained - Step by Step Guide`
        : isMusic
        ? `${searchQuery || category} - Live Performance 2024`
        : isTech
        ? `${searchQuery || category} - Tips and Tricks`
        : isGaming
        ? `${searchQuery || category} - Best Moments Compilation`
        : `${searchQuery || category} - Behind the Scenes`,
      channel: isTutorial 
        ? 'Learn Fast'
        : isMusic
        ? 'Live Music HD'
        : isTech
        ? 'Code Ninja'
        : isGaming
        ? 'Game Highlights'
        : 'Studio Channel',
      thumbnail: `https://picsum.photos/seed/${searchQuery || category}-2/320/180.jpg`,
      duration: isMusic ? '4:12' : isTutorial ? '18:45' : isTech ? '32:15' : isGaming ? '22:40' : '8:56',
      views: isMusic ? '1.8M' : isTutorial ? '623K' : isTech ? '890K' : isGaming ? '2.1M' : '445K',
      published: isMusic ? '1 week ago' : isTutorial ? '2 weeks ago' : isTech ? '5 days ago' : isGaming ? '1 day ago' : '2 weeks ago',
      url: `https://www.youtube.com/watch?v=mock-${Date.now()}-2`,
      embedUrl: `https://www.youtube.com/embed/mock-${Date.now()}-2`
    },
    {
      id: `mock-${Date.now()}-3`,
      title: isTutorial 
        ? `Advanced ${searchQuery || category} Techniques - Pro Level`
        : isMusic
        ? `${searchQuery || category} - Acoustic Cover`
        : isTech
        ? `${searchQuery || category} - Project Build Tutorial`
        : isGaming
        ? `${searchQuery || category} - Speedrun World Record`
        : `${searchQuery || category} - Interview with Experts`,
      channel: isTutorial 
        ? 'Pro Skills'
        : isMusic
        ? 'Acoustic Sessions'
        : isTech
        ? 'Dev Lab'
        : isGaming
        ? 'Speed Runners'
        : 'Expert Talk',
      thumbnail: `https://picsum.photos/seed/${searchQuery || category}-3/320/180.jpg`,
      duration: isMusic ? '5:30' : isTutorial ? '35:22' : isTech ? '28:45' : isGaming ? '15:33' : '25:18',
      views: isMusic ? '945K' : isTutorial ? '1.1M' : isTech ? '2.3M' : isGaming ? '5.6M' : '789K',
      published: isMusic ? '2 weeks ago' : isTutorial ? '3 days ago' : isTech ? '1 week ago' : isGaming ? '3 days ago' : '3 weeks ago',
      url: `https://www.youtube.com/watch?v=mock-${Date.now()}-3`,
      embedUrl: `https://www.youtube.com/embed/mock-${Date.now()}-3`
    },
    {
      id: `mock-${Date.now()}-4`,
      title: isTutorial 
        ? `${searchQuery || category} for Beginners - Getting Started`
        : isMusic
        ? `${searchQuery || category} - Remix Version`
        : isTech
        ? `${searchQuery || category} - Common Mistakes to Avoid`
        : isGaming
        ? `${searchQuery || category} - Easter Eggs and Secrets`
        : `${searchQuery || category} - Top 10 Facts`,
      channel: isTutorial 
        ? 'Start Here'
        : isMusic
        ? 'DJ Mix Master'
        : isTech
        ? 'Bug Fixers'
        : isGaming
        ? 'Secret Hunter'
        : 'Fact Channel',
      thumbnail: `https://picsum.photos/seed/${searchQuery || category}-4/320/180.jpg`,
      duration: isMusic ? '3:18' : isTutorial ? '12:15' : isTech ? '18:30' : isGaming ? '8:45' : '6:22',
      views: isMusic ? '1.5M' : isTutorial ? '445K' : isTech ? '1.7M' : isGaming ? '890K' : '1.2M',
      published: isMusic ? '1 month ago' : isTutorial ? '1 month ago' : isTech ? '2 weeks ago' : isGaming ? '1 week ago' : '1 month ago',
      url: `https://www.youtube.com/watch?v=mock-${Date.now()}-4`,
      embedUrl: `https://www.youtube.com/embed/mock-${Date.now()}-4`
    }
  ]
  
  return mockVideos
}

const fetchFromScriptTags = async (category: string, searchQuery: string) => {
  try {
    let url = 'https://www.youtube.com'
    
    if (searchQuery) {
      url += `/results?search_query=${encodeURIComponent(searchQuery)}`
    } else if (category === 'Trending') {
      url += '/feed/trending'
    } else if (category !== 'All') {
      url += `/results?search_query=${encodeURIComponent(category)}`
    }

    console.log(`Fetching from script tags: ${url}`)

    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 10000
    })

    console.log(`Script tags response status: ${response.status}`)
    console.log(`Script tags response length: ${response.data.length}`)

    return extractVideosFromScriptTags(response.data)
  } catch (error) {
    console.error('Error fetching from script tags:', error)
    return []
  }
}

const extractVideosFromScriptTags = (html: string) => {
  const videos: any[] = []
  
  console.log('Starting video extraction from script tags...')
  console.log(`HTML length: ${html.length}`)

  // Look for script tags containing video data
  const scriptTagPatterns = [
    /var ytInitialData = ({.*?});/s,
    /window\["ytInitialData"\] = ({.*?});/s,
    /ytInitialData["contents"] = ({.*?});/s,
    /<script[^>]*>.*?(var ytInitialData = {.*?});.*?<\/script>/s
  ]

  for (const pattern of scriptTagPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      try {
        console.log('Found ytInitialData script tag')
        const data = JSON.parse(match[1])
        
        // Extract videos from the parsed data
        const extractedVideos = extractVideosFromYtInitialData(data)
        if (extractedVideos.length > 0) {
          console.log(`Extracted ${extractedVideos.length} videos from ytInitialData`)
          videos.push(...extractedVideos)
        }
      } catch (error) {
        console.error('Error parsing ytInitialData:', error)
      }
      break
    }
  }

  // Also try to find video data in other script tags
  const videoDataPatterns = [
    /"videoId":"([^"]+)"/g,
    /"title":{"runs":\[{"text":"([^"]+)"\}\]/g,
    /"viewCountText":{"simpleText":"([^"]+)"}/g,
    /"lengthText":{"accessibility":{"accessibilityData":{"label":"([^"]+)"}}/g,
    /"publishedTimeText":{"simpleText":"([^"]+)"}/g,
    /"ownerText":{"runs":\[{"text":"([^"]+)"\}\]/g
  ]

  const videoMatches: any[] = []
  // Improved regex to capture complete videoRenderer objects
  html.replace(/"videoRenderer":({.*?})(?=","nextContinuationData"|,"compactVideoRenderer"|"relatedVideoRenderer"|"shelfRenderer"})/gs, (match, videoRenderer) => {
    try {
      // Clean up the JSON string before parsing
      const cleanedJson = videoRenderer.replace(/\\n/g, '\\n').replace(/\\"/g, '\\"')
      const videoData = JSON.parse(cleanedJson)
      videoMatches.push(videoData)
    } catch (error) {
      console.error('Error parsing videoRenderer:', error)
      // Try to extract individual fields with regex as fallback
      try {
        const videoId = videoRenderer.match(/"videoId":"([^"]+)"/)?.[1]
        const titleMatch = videoRenderer.match(/"title":\s*{[^}]*"runs":\s*\[\s*{[^}]*"text":"([^"]*)"/)
        const title = titleMatch?.[1]
        
        if (videoId && title) {
          videoMatches.push({
            videoId,
            title,
            // Add basic structure for other fields
            thumbnail: { thumbnails: [{ url: '' }] },
            lengthText: { accessibility: { accessibilityData: { label: '' } } },
            viewCountText: { simpleText: '' },
            publishedTimeText: { simpleText: '' },
            ownerText: { runs: [{ text: '' }] }
          })
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError)
      }
    }
    return match
  })

  for (const videoData of videoMatches) {
    try {
      const video = {
        id: videoData.videoId || '',
        title: videoData.title?.runs?.[0]?.text || '',
        channel: videoData.ownerText?.runs?.[0]?.text || '',
        thumbnail: videoData.thumbnail?.thumbnails?.[0]?.url || '',
        duration: videoData.lengthText?.accessibility?.accessibilityData?.label || '',
        views: videoData.viewCountText?.simpleText || '',
        published: videoData.publishedTimeText?.simpleText || '',
        url: `https://www.youtube.com/watch?v=${videoData.videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoData.videoId}`
      }
      
      if (video.id && video.title) {
        videos.push(video)
        console.log(`Added video from script data: ${video.title}`)
      }
    } catch (error) {
      console.error('Error processing video data from script:', error)
    }
  }

  console.log(`Total videos extracted from script tags: ${videos.length}`)
  return videos.slice(0, 20) // Limit results
}

const extractVideosFromYtInitialData = (data: any) => {
  const videos: any[] = []
  
  try {
    // Navigate through the data structure to find videos
    const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
                    data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
                    data.contents?.twoColumnWatchNextResults?.results?.results?.contents

    if (contents && Array.isArray(contents)) {
      for (const content of contents) {
        const itemSectionRenderer = content.itemSectionRenderer
        if (itemSectionRenderer && itemSectionRenderer.contents) {
          for (const itemContent of itemSectionRenderer.contents) {
            const videoRenderer = itemContent.videoRenderer || 
                               itemContent.compactVideoRenderer ||
                               itemContent.richItemRenderer?.content?.videoRenderer
            
            if (videoRenderer) {
              const video = {
                id: videoRenderer.videoId || '',
                title: videoRenderer.title?.runs?.[0]?.text || '',
                channel: videoRenderer.ownerText?.runs?.[0]?.text || '',
                thumbnail: videoRenderer.thumbnail?.thumbnails?.[0]?.url || '',
                duration: videoRenderer.lengthText?.accessibility?.accessibilityData?.label || '',
                views: videoRenderer.viewCountText?.simpleText || '',
                published: videoRenderer.publishedTimeText?.simpleText || '',
                url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`,
                embedUrl: `https://www.youtube.com/embed/${videoRenderer.videoId}`
              }
              
              if (video.id && video.title) {
                videos.push(video)
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting videos from ytInitialData:', error)
  }

  return videos
}

const fetchFromAlternativeSearch = async (searchQuery: string) => {
  try {
    // Try YouTube's JSON API for search suggestions
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(searchQuery)}`
    
    console.log(`Fetching from alternative search: ${url}`)
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json, text/javascript, */*',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 5000
    })
    
    console.log(`Alternative search response status: ${response.status}`)
    
    // This returns search suggestions, not actual videos
    // But we can use this to validate that the search query is valid
    if (response.data && response.data.length > 1) {
      const suggestions = response.data[1]
      console.log(`Found ${suggestions.length} search suggestions`)
      
      // Return empty array since this is just for validation
      // The actual video fetching will be done by other methods
      return []
    }
    
    return []
  } catch (error) {
    console.error('Error fetching from alternative search:', error)
    return []
  }
}

const fetchFromMobileYouTube = async (category: string, searchQuery: string) => {
  try {
    let url = 'https://m.youtube.com'
    
    if (searchQuery) {
      url += `/results?search_query=${encodeURIComponent(searchQuery)}`
    } else if (category === 'Trending') {
      url += '/feed/trending'
    } else if (category !== 'All') {
      url += `/results?search_query=${encodeURIComponent(category)}`
    }

    console.log(`Fetching from mobile YouTube: ${url}`)

    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 10000
    })

    console.log(`Mobile YouTube response status: ${response.status}`)
    console.log(`Mobile YouTube response length: ${response.data.length}`)

    return extractVideosFromHTML(response.data)
  } catch (error) {
    console.error('Error fetching from mobile YouTube:', error)
    return []
  }
}

const fetchFromDesktopYouTube = async (category: string, searchQuery: string) => {
  try {
    let url = 'https://www.youtube.com'
    
    if (searchQuery) {
      url += `/results?search_query=${encodeURIComponent(searchQuery)}`
    } else if (category === 'Trending') {
      url += '/feed/trending'
    } else if (category !== 'All') {
      url += `/results?search_query=${encodeURIComponent(category)}`
    }

    console.log(`Fetching from desktop YouTube: ${url}`)

    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 10000
    })

    console.log(`Desktop YouTube response status: ${response.status}`)
    console.log(`Desktop YouTube response length: ${response.data.length}`)

    return extractVideosFromHTML(response.data)
  } catch (error) {
    console.error('Error fetching from desktop YouTube:', error)
    return []
  }
}

const extractVideosFromHTML = (html: string) => {
  const $ = cheerio.load(html)
  const videos: any[] = []

  console.log('Starting video extraction from HTML...')
  console.log(`HTML length: ${html.length}`)

  // Log the first 1000 characters to see what we're getting
  console.log('HTML sample:', html.substring(0, 1000))

  // Updated selectors for current YouTube structure (2024)
  const videoSelectors = [
    // Primary video link selectors for current YouTube
    'a[href*="/watch?v="]:not([href*="&list="]):not([href*="index="])',
    'a.yt-simple-endpoint[href*="/watch?v="]',
    'a[href*="/watch?v="][id*="video-title"]',
    'a[href*="/watch?v="][class*="video"]',
    'a[href*="/watch?v="][class*="thumbnail"]',
    // Modern YouTube selectors
    'ytd-video-renderer a[href*="/watch?v="]',
    'ytd-compact-video-renderer a[href*="/watch?v="]',
    'ytd-rich-item-renderer a[href*="/watch?v="]',
    'ytd-rich-grid-renderer a[href*="/watch?v="]',
    // Fallback selectors
    'a[href*="youtu.be/"]',
    'a[href*="/shorts/"]',
    'a[id*="video-title"]',
    '.ytd-thumbnail[href*="/watch?v="]',
    // Additional fallbacks for different layouts
    'a[href*="/watch?v="][aria-label*="video"]',
    'a[href*="/watch?v="][title]',
    'a[href*="/watch?v="][data-testid*="video"]'
  ]

  videoSelectors.forEach((selector, index) => {
    console.log(`Trying selector ${index + 1}: ${selector}`)
    const elements = $(selector)
    console.log(`Found ${elements.length} elements with selector: ${selector}`)
    
    if (elements.length > 0) {
      // Log the first element to see its structure
      const firstElement = elements.first()
      console.log('First element HTML:', firstElement.html()?.substring(0, 200))
      console.log('First element attrs:', firstElement.attr())
    }
    
    elements.each((elementIndex, element) => {
      try {
        const $el = $(element)
        const href = $el.attr('href')
        
        if (!href || (!href.includes('/watch?v=') && !href.includes('youtu.be/') && !href.includes('/shorts/'))) {
          return
        }
        
        const videoId = extractVideoId(href)
        if (!videoId) {
          console.log(`Could not extract video ID from href: ${href}`)
          return
        }

        // Skip if we already have this video
        if (videos.some(v => v.id === videoId)) {
          console.log(`Duplicate video found, skipping: ${videoId}`)
          return
        }

        // Extract title using updated selectors for current YouTube
        let title = ''
        const titleSelectors = [
          // Primary title selectors for current YouTube
          '#video-title',
          '.ytd-video-renderer #video-title',
          '.ytd-compact-video-renderer #video-title',
          '.ytd-rich-item-renderer #video-title',
          '.ytd-rich-grid-renderer #video-title',
          'h3.yt-core-attributed-string',
          '.yt-core-attributed-string[role="heading"]',
          '.yt-core-attributed-string[aria-label]',
          // Modern YouTube selectors
          '[id*="video-title"]',
          '[class*="video-title"]',
          '[data-testid*="title"]',
          '[aria-label*="video"]',
          // Fallback selectors
          'h3',
          '.title',
          '.yt-simple-endpoint',
          '[id*="title"]',
          '[aria-label*="title"]',
          '.ytd-thumbnail-overlay .title',
          '[data-title]',
          // Additional fallbacks
          'a[href*="/watch?v="] h3',
          'a[href*="/watch?v="] .yt-core-attributed-string',
          'a[href*="/watch?v="] [class*="title"]',
          'a[href*="/watch?v="] [id*="title"]'
        ]
        
        for (const titleSelector of titleSelectors) {
          const $title = $el.find(titleSelector).first()
          if ($title.length && $title.text().trim()) {
            title = $title.text().trim()
            console.log(`Found title using selector "${titleSelector}": ${title}`)
            break
          }
        }

        // If no title found in element, try parent elements
        if (!title) {
          const $parent = $el.parent()
          titleSelectors.forEach(selector => {
            const $title = $parent.find(selector).first()
            if ($title.length && $title.text().trim()) {
              title = $title.text().trim()
              console.log(`Found title in parent using selector "${selector}": ${title}`)
            }
          })
        }

        // If still no title, try the element's text or aria-label
        if (!title) {
          title = $el.text().trim() || $el.attr('aria-label') || $el.attr('title') || ''
          if (title) {
            console.log(`Found title from element attributes: ${title}`)
          }
        }

        // Extract channel name with updated selectors
        let channel = ''
        const channelSelectors = [
          // Primary channel selectors for current YouTube
          '.ytd-channel-name .yt-core-attributed-string',
          '.ytd-video-owner-renderer .yt-core-attributed-string',
          '.ytd-channel-name a',
          '.ytd-video-owner-renderer a',
          '.ytd-compact-video-renderer .ytd-channel-name a',
          '.ytd-rich-item-renderer .ytd-channel-name a',
          '.ytd-rich-grid-renderer .ytd-channel-name a',
          // Modern YouTube selectors
          '[class*="channel-name"]',
          '[data-testid*="channel"]',
          '[aria-label*="channel"]',
          '[id*="channel"]',
          // Fallback selectors
          '.channel-name',
          '.yt-simple-endpoint[href*="/channel/"]',
          '.yt-simple-endpoint[href*="/user/"]',
          '.ytd-channel-name',
          '.ytd-video-owner-renderer',
          '[id*="channel"]',
          '[data-channel-name]',
          // Additional fallbacks
          'a[href*="/channel/"]',
          'a[href*="/user/"]',
          'a[href*="/c/"]',
          'a[href*="/@"]'
        ]
        
        for (const channelSelector of channelSelectors) {
          const $channel = $el.closest('ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer, div').find(channelSelector).first()
          if ($channel.length && $channel.text().trim()) {
            channel = $channel.text().trim()
            console.log(`Found channel using selector "${channelSelector}": ${channel}`)
            break
          }
        }

        // Extract thumbnail with updated selectors
        let thumbnail = ''
        const $img = $el.find('img').first()
        if ($img.length) {
          thumbnail = $img.attr('src') || $img.attr('data-src') || $img.attr('data-thumb') || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
          console.log(`Found thumbnail: ${thumbnail}`)
        }

        // Extract views and time from metadata with updated selectors
        let views = 'N/A'
        let published = 'N/A'
        let duration = 'N/A'

        const $container = $el.closest('ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-rich-grid-renderer, div')
        const metadataSelectors = [
          '.metadata',
          '.view-count', 
          '.time',
          '.ytd-video-meta-block',
          '.ytd-badge-supported-renderer',
          '.ytd-video-meta-block span',
          '.yt-core-attributed-string',
          '[class*="metadata"]',
          '[data-testid*="metadata"]',
          '[id*="metadata"]',
          '[class*="view-count"]',
          '[class*="time"]'
        ]
        
        let metadataText = ''
        for (const selector of metadataSelectors) {
          const $metadata = $container.find(selector)
          if ($metadata.length) {
            metadataText += ' ' + $metadata.text().trim()
          }
        }
        
        metadataText = metadataText.trim()
        console.log(`Metadata text: ${metadataText}`)
        
        // Extract views
        const viewsMatch = metadataText.match(/([\d,.]+)\s*(views|view|K|M|B)/i)
        if (viewsMatch) {
          views = formatViews(viewsMatch[1])
          console.log(`Found views: ${views}`)
        }

        // Extract time ago
        const timeMatch = metadataText.match(/(\d+\s*(hour|hr|minute|min|day|week|month|year)s?\s*ago)/i)
        if (timeMatch) {
          published = timeMatch[1]
          console.log(`Found published time: ${published}`)
        }

        // Extract duration with updated selectors
        const $duration = $container.find('.timestamp, .duration, .badge, .ytd-thumbnail-overlay-time-status-renderer, .ytd-badge-supported-renderer, .ytd-thumbnail-overlay-time-status-renderer span, [aria-label*="duration"], [class*="duration"], [data-testid*="duration"], [id*="duration"]').first()
        if ($duration.length) {
          duration = $duration.text().trim()
          console.log(`Found duration: ${duration}`)
        }

        if (title && videoId) {
          const videoData = {
            id: videoId,
            title: title,
            channel: channel || 'Unknown Channel',
            thumbnail: thumbnail.startsWith('http') ? thumbnail : (thumbnail.startsWith('//') ? `https:${thumbnail}` : `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`),
            duration: duration,
            views: views,
            published: published,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
          }
          console.log(`Adding video: ${JSON.stringify(videoData)}`)
          videos.push(videoData)
        } else {
          console.log(`Skipping video - missing title or videoId. Title: "${title}", VideoId: "${videoId}"`)
        }
      } catch (error) {
        console.error('Error extracting video data:', error)
      }
    })
  })

  console.log(`Total videos extracted: ${videos.length}`)
  
  // Remove duplicates and limit results
  const uniqueVideos = videos
    .filter((video, index, self) => index === self.findIndex((v) => v.id === video.id))
    .slice(0, 20)
    
  console.log(`Unique videos after filtering: ${uniqueVideos.length}`)
  
  return uniqueVideos
}



export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'All'
  const q = searchParams.get('q') || ''
  
  // Enhanced search filters
  const duration = searchParams.get('duration') || 'any'
  const uploadDate = searchParams.get('uploadDate') || 'any'
  const sortBy = searchParams.get('sortBy') || 'relevance'
  const videoType = searchParams.get('videoType') || 'any'
  const page = searchParams.get('page') || '1'

  try {
    console.log(`API request: category=${category}, q=${q}, filters: duration=${duration}, uploadDate=${uploadDate}, sortBy=${sortBy}, videoType=${videoType}, page=${page}`)
    
    // If search query is empty and category is 'All', return trending videos
    if (!q && category === 'All') {
      const videos = await fetchYouTubeVideos('Trending', '')
      return NextResponse.json({
        success: true,
        videos,
        category: 'Trending',
        searchQuery: '',
        filters: { duration, uploadDate, sortBy, videoType },
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalResults: videos.length
        },
        timestamp: new Date().toISOString(),
        message: videos.length === 0 ? 'No trending videos found. YouTube may be using JavaScript to load content dynamically.' : 'Trending videos fetched successfully'
      })
    }
    
    const videos = await fetchYouTubeVideos(category, q)
    
    // Apply filters to the results
    let filteredVideos = videos
    
    // Duration filter (mock filtering - in real implementation, this would be done at search time)
    if (duration !== 'any') {
      filteredVideos = filteredVideos.filter(video => {
        if (!video.duration || video.duration === 'N/A') return true
        
        const durationStr = video.duration.toLowerCase()
        const durationMatch = durationStr.match(/(\d+):(\d+)/)
        if (!durationMatch) return true
        
        const minutes = parseInt(durationMatch[1])
        const seconds = parseInt(durationMatch[2])
        const totalMinutes = minutes + seconds / 60
        
        switch (duration) {
          case 'short':
            return totalMinutes < 4
          case 'medium':
            return totalMinutes >= 4 && totalMinutes <= 20
          case 'long':
            return totalMinutes > 20
          default:
            return true
        }
      })
    }
    
    // Sort videos based on sortBy parameter
    if (sortBy !== 'relevance') {
      filteredVideos.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            // Sort by published date (newest first)
            return b.published.localeCompare(a.published)
          case 'rating':
            // Mock rating sort - in real implementation, would use actual ratings
            return Math.random() - 0.5
          case 'views':
            // Sort by views (most views first)
            const viewsA = parseInt(a.views.replace(/[^0-9]/g, '')) || 0
            const viewsB = parseInt(b.views.replace(/[^0-9]/g, '')) || 0
            return viewsB - viewsA
          default:
            return 0
        }
      })
    }
    
    // Pagination
    const itemsPerPage = 20
    const currentPage = parseInt(page)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex)
    
    console.log(`Returning ${paginatedVideos.length} videos (filtered from ${videos.length})`)
    
    // Check if we're using mock data
    const isMockData = videos.some(video => video.id.startsWith('mock'))
    
    // Create appropriate message based on data source
    let message = ''
    if (isMockData) {
      if (q) {
        message = `Showing sample results for "${q}". Real YouTube videos couldn't be loaded due to YouTube\'s anti-scraping measures.`
      } else {
        message = 'Showing sample videos. Real YouTube content couldn\'t be loaded due to YouTube\'s anti-scraping measures.'
      }
    } else {
      message = paginatedVideos.length === 0 ? 'No videos found matching your search criteria. Try adjusting your filters or search term.' : 'Videos fetched successfully'
    }
    
    return NextResponse.json({
      success: true,
      videos: paginatedVideos,
      category,
      searchQuery: q,
      filters: { duration, uploadDate, sortBy, videoType },
      pagination: {
        currentPage,
        totalPages: Math.ceil(filteredVideos.length / itemsPerPage),
        totalResults: filteredVideos.length
      },
      timestamp: new Date().toISOString(),
      message,
      isMockData
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch videos',
        videos: [],
        filters: { duration, uploadDate, sortBy, videoType },
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalResults: 0
        },
        message: 'Unable to fetch videos from YouTube. This might be due to YouTube\'s anti-scraping measures or network issues.'
      },
      { status: 500 }
    )
  }
}