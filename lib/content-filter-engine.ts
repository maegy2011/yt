/**
 * Professional Content Filtering Engine
 * 
 * High-performance content filtering system with:
 * - Multi-layered filtering (blacklist, whitelist, patterns)
 * - Intelligent caching with TTL
 * - Performance monitoring and metrics
 * - Support for thousands of entries
 * - Category-based organization
 * - Priority-based conflict resolution
 */

import { db } from '@/lib/db'
import { createHash } from 'crypto'

// Types for content filtering
export interface ContentItem {
  id: string
  itemId: string
  type: 'video' | 'playlist' | 'channel'
  title: string
  channelName?: string
  description?: string
  tags?: string[]
}

export interface FilterResult {
  allowed: boolean
  blocked: boolean
  whitelisted: boolean
  reason?: string
  matchedBy?: 'blacklist' | 'whitelist' | 'pattern'
  matchedRule?: string
  confidence: number
  category?: string
  severity?: string
  cached: boolean
  responseTime: number
}

export interface FilterMetrics {
  totalRequests: number
  blockedRequests: number
  whitelistedRequests: number
  cacheHitRate: number
  avgResponseTime: number
  activeRules: number
}

export interface PatternMatch {
  patternId: string
  pattern: string
  type: string
  confidence: number
  matchedText: string
}

class ContentFilterEngine {
  private cache = new Map<string, { result: FilterResult; expires: number }>()
  private metrics: FilterMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    whitelistedRequests: 0,
    cacheHitRate: 0,
    avgResponseTime: 0,
    activeRules: 0
  }
  private lastCleanup = Date.now()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000 // 1 minute

  constructor() {
    // Start periodic cleanup
    setInterval(() => this.cleanupCache(), this.CLEANUP_INTERVAL)
    // Start metrics collection
    setInterval(() => this.collectMetrics(), 60 * 1000) // Every minute
  }

  /**
   * Main filtering method - checks if content is allowed
   */
  async filterContent(item: ContentItem): Promise<FilterResult> {
    const startTime = performance.now()
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(item)
      const cached = this.cache.get(cacheKey)
      
      if (cached && cached.expires > Date.now()) {
        this.updateMetrics(true, performance.now() - startTime)
        return { ...cached.result, cached: true }
      }

      // Perform actual filtering
      const result = await this.performFiltering(item)
      
      // Cache the result
      this.cache.set(cacheKey, {
        result,
        expires: Date.now() + this.CACHE_TTL
      })

      this.updateMetrics(false, performance.now() - startTime)
      return { ...result, cached: false }
      
    } catch (error) {
      console.error('Content filtering error:', error)
      return {
        allowed: true,
        blocked: false,
        whitelisted: false,
        reason: 'Filtering error - allowed by default',
        confidence: 0,
        cached: false,
        responseTime: performance.now() - startTime
      }
    }
  }

  /**
   * Core filtering logic with priority-based conflict resolution
   */
  private async performFiltering(item: ContentItem): Promise<FilterResult> {
    // 1. Check whitelist first (highest priority)
    const whitelistResult = await this.checkWhitelist(item)
    if (whitelistResult.matched) {
      await this.updateMatchCount(whitelistResult.ruleId!, 'whitelist')
      return {
        allowed: true,
        blocked: false,
        whitelisted: true,
        reason: whitelistResult.reason,
        matchedBy: 'whitelist',
        matchedRule: whitelistResult.ruleId,
        confidence: whitelistResult.confidence,
        category: whitelistResult.category,
        severity: whitelistResult.severity,
        cached: false,
        responseTime: 0
      }
    }

    // 2. Check blacklist patterns
    const patternResult = await this.checkPatterns(item)
    if (patternResult.matched) {
      await this.updateMatchCount(patternResult.ruleId!, 'pattern')
      await this.updatePatternMatchCount(patternResult.ruleId!)
      
      return {
        allowed: false,
        blocked: true,
        whitelisted: false,
        reason: `Pattern match: ${patternResult.reason}`,
        matchedBy: 'pattern',
        matchedRule: patternResult.ruleId,
        confidence: patternResult.confidence,
        category: patternResult.category,
        severity: patternResult.severity,
        cached: false,
        responseTime: 0
      }
    }

    // 3. Check blacklist items
    const blacklistResult = await this.checkBlacklist(item)
    if (blacklistResult.matched) {
      await this.updateMatchCount(blacklistResult.ruleId!, 'blacklist')
      
      return {
        allowed: false,
        blocked: true,
        whitelisted: false,
        reason: blacklistResult.reason,
        matchedBy: 'blacklist',
        matchedRule: blacklistResult.ruleId,
        confidence: blacklistResult.confidence,
        category: blacklistResult.category,
        severity: blacklistResult.severity,
        cached: false,
        responseTime: 0
      }
    }

    // 4. Content is allowed
    return {
      allowed: true,
      blocked: false,
      whitelisted: false,
      reason: 'No matching rules found',
      confidence: 100,
      cached: false,
      responseTime: 0
    }
  }

  /**
   * Check whitelist with priority-based ordering
   */
  private async checkWhitelist(item: ContentItem): Promise<{
    matched: boolean
    ruleId?: string
    reason?: string
    confidence: number
    category?: string
    severity?: string
  }> {
    // Check direct item matches
    const directMatch = await db.whitelistedItem.findFirst({
      where: {
        itemId: item.itemId,
        type: item.type,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { priority: 'desc' }
    })

    if (directMatch) {
      return {
        matched: true,
        ruleId: directMatch.id,
        reason: `Direct whitelist match: ${directMatch.reason || 'Manual whitelist'}`,
        confidence: 100,
        severity: directMatch.severity
      }
    }

    // Check channel-level whitelist
    if (item.channelName && item.type === 'video') {
      const channelMatch = await db.whitelistedItem.findFirst({
        where: {
          itemId: item.channelName,
          type: 'channel',
          isChannelWhitelist: true,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { priority: 'desc' }
      })

      if (channelMatch) {
        return {
          matched: true,
          ruleId: channelMatch.id,
          reason: `Channel whitelist: ${channelMatch.reason || 'Channel whitelisted'}`,
          confidence: 95,
          severity: channelMatch.severity
        }
      }
    }

    return { matched: false, confidence: 0 }
  }

  /**
   * Check blacklist with priority-based ordering
   */
  private async checkBlacklist(item: ContentItem): Promise<{
    matched: boolean
    ruleId?: string
    reason?: string
    confidence: number
    category?: string
    severity?: string
  }> {
    // Check direct item matches
    const directMatch = await db.blacklistedItem.findFirst({
      where: {
        itemId: item.itemId,
        type: item.type,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { priority: 'desc' },
      include: {
        category: {
          select: { name: true }
        }
      }
    })

    if (directMatch) {
      return {
        matched: true,
        ruleId: directMatch.id,
        reason: `Blacklist match: ${directMatch.reason || 'Manual blacklist'}`,
        confidence: 100,
        category: directMatch.category?.name,
        severity: directMatch.severity
      }
    }

    // Check channel-level blacklist
    if (item.channelName && item.type === 'video') {
      const channelMatch = await db.blacklistedItem.findFirst({
        where: {
          itemId: item.channelName,
          type: 'channel',
          isChannelBlock: true,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { priority: 'desc' },
        include: {
          category: {
            select: { name: true }
          }
        }
      })

      if (channelMatch) {
        return {
          matched: true,
          ruleId: channelMatch.id,
          reason: `Channel blacklist: ${channelMatch.reason || 'Channel blacklisted'}`,
          confidence: 95,
          category: channelMatch.category?.name,
          severity: channelMatch.severity
        }
      }
    }

    return { matched: false, confidence: 0 }
  }

  /**
   * Advanced pattern matching with multiple algorithms
   */
  private async checkPatterns(item: ContentItem): Promise<{
    matched: boolean
    ruleId?: string
    reason?: string
    confidence: number
    category?: string
    severity?: string
  }> {
    const patterns = await db.blacklistPattern.findMany({
      where: {
        isActive: true,
        OR: [
          { type: item.type },
          { type: 'all' }
        ]
      },
      orderBy: { priority: 'desc' },
      include: {
        category: {
          select: { name: true }
        }
      }
    })

    for (const pattern of patterns) {
      const match = this.testPattern(pattern, item)
      if (match.matched && match.confidence >= pattern.matchThreshold) {
        return {
          matched: true,
          ruleId: pattern.id,
          reason: match.reason,
          confidence: match.confidence,
          category: pattern.category?.name,
          severity: pattern.severity
        }
      }
    }

    return { matched: false, confidence: 0 }
  }

  /**
   * Test individual pattern against content
   */
  private testPattern(pattern: any, item: ContentItem): {
    matched: boolean
    reason?: string
    confidence: number
  } {
    const searchText = this.getSearchText(pattern.type, item)
    if (!searchText) return { matched: false, confidence: 0 }

    try {
      switch (pattern.patternType) {
        case 'keyword':
          return this.testKeywordPattern(pattern, searchText)
        case 'regex':
          return this.testRegexPattern(pattern, searchText)
        case 'wildcard':
          return this.testWildcardPattern(pattern, searchText)
        case 'fuzzy':
          return this.testFuzzyPattern(pattern, searchText)
        default:
          return { matched: false, confidence: 0 }
      }
    } catch (error) {
      console.error(`Pattern test error for ${pattern.id}:`, error)
      return { matched: false, confidence: 0 }
    }
  }

  /**
   * Get text to search based on pattern type
   */
  private getSearchText(patternType: string, item: ContentItem): string {
    switch (patternType) {
      case 'title':
        return item.title.toLowerCase()
      case 'channel':
        return (item.channelName || '').toLowerCase()
      case 'description':
        return (item.description || '').toLowerCase()
      case 'tags':
        return (item.tags || []).join(' ').toLowerCase()
      case 'all':
        return [
          item.title,
          item.channelName || '',
          item.description || '',
          ...(item.tags || [])
        ].join(' ').toLowerCase()
      default:
        return item.title.toLowerCase()
    }
  }

  /**
   * Test keyword pattern
   */
  private testKeywordPattern(pattern: any, text: string): {
    matched: boolean
    reason?: string
    confidence: number
  } {
    const keywords = pattern.pattern.toLowerCase().split(',').map(k => k.trim())
    const matchedKeyword = keywords.find(keyword => 
      text.includes(keyword)
    )

    if (matchedKeyword) {
      return {
        matched: true,
        reason: `Keyword match: "${matchedKeyword}"`,
        confidence: 85
      }
    }

    return { matched: false, confidence: 0 }
  }

  /**
   * Test regex pattern
   */
  private testRegexPattern(pattern: any, text: string): {
    matched: boolean
    reason?: string
    confidence: number
  } {
    const flags = pattern.isCaseSensitive ? 'g' : 'gi'
    const regex = new RegExp(pattern.pattern, flags)
    const match = regex.test(text)

    if (match) {
      return {
        matched: true,
        reason: `Regex match: ${pattern.pattern}`,
        confidence: 90
      }
    }

    return { matched: false, confidence: 0 }
  }

  /**
   * Test wildcard pattern
   */
  private testWildcardPattern(pattern: any, text: string): {
    matched: boolean
    reason?: string
    confidence: number
  } {
    const wildcardRegex = pattern.pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    const flags = pattern.isCaseSensitive ? 'g' : 'gi'
    const regex = new RegExp(`^${wildcardRegex}$`, flags)
    const match = regex.test(text)

    if (match) {
      return {
        matched: true,
        reason: `Wildcard match: ${pattern.pattern}`,
        confidence: 80
      }
    }

    return { matched: false, confidence: 0 }
  }

  /**
   * Test fuzzy pattern (simple implementation)
   */
  private testFuzzyPattern(pattern: any, text: string): {
    matched: boolean
    reason?: string
    confidence: number
  } {
    const patternLower = pattern.pattern.toLowerCase()
    const textLower = text.toLowerCase()
    
    // Simple fuzzy matching - contains with some tolerance
    const similarity = this.calculateSimilarity(patternLower, textLower)
    
    if (similarity > 0.7) {
      return {
        matched: true,
        reason: `Fuzzy match: ${pattern.pattern} (${Math.round(similarity * 100)}% similar)`,
        confidence: Math.round(similarity * 100)
      }
    }

    return { matched: false, confidence: 0 }
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    )

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Generate cache key for content item
   */
  private generateCacheKey(item: ContentItem): string {
    const keyData = `${item.itemId}:${item.type}:${item.title}:${item.channelName || ''}`
    return createHash('md5').update(keyData).digest('hex')
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key)
      }
    }
    this.lastCleanup = now
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(cached: boolean, responseTime: number): void {
    this.metrics.totalRequests++
    
    if (cached) {
      this.metrics.cacheHitRate = 
        (this.metrics.cacheHitRate * (this.metrics.totalRequests - 1) + 1) / 
        this.metrics.totalRequests
    }
    
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests
  }

  /**
   * Collect and store metrics in database
   */
  private async collectMetrics(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      await db.filteringMetrics.upsert({
        where: { date: new Date(today) },
        update: {
          totalRequests: this.metrics.totalRequests,
          blockedRequests: this.metrics.blockedRequests,
          whitelistedRequests: this.metrics.whitelistedRequests,
          avgResponseTime: this.metrics.avgResponseTime,
          cacheHitRate: this.metrics.cacheHitRate,
          activeRules: await this.getActiveRulesCount()
        },
        create: {
          date: new Date(today),
          totalRequests: this.metrics.totalRequests,
          blockedRequests: this.metrics.blockedRequests,
          whitelistedRequests: this.metrics.whitelistedRequests,
          avgResponseTime: this.metrics.avgResponseTime,
          cacheHitRate: this.metrics.cacheHitRate,
          activeRules: await this.getActiveRulesCount()
        }
      })
    } catch (error) {
      console.error('Metrics collection error:', error)
    }
  }

  /**
   * Get count of active rules
   */
  private async getActiveRulesCount(): Promise<number> {
    const [blacklistCount, whitelistCount, patternCount] = await Promise.all([
      db.blacklistedItem.count({ where: { isActive: true } }),
      db.whitelistedItem.count({ where: { isActive: true } }),
      db.blacklistPattern.count({ where: { isActive: true } })
    ])
    
    return blacklistCount + whitelistCount + patternCount
  }

  /**
   * Update match count for rules
   */
  private async updateMatchCount(ruleId: string, type: 'blacklist' | 'whitelist' | 'pattern'): Promise<void> {
    try {
      if (type === 'pattern') {
        await db.blacklistPattern.update({
          where: { id: ruleId },
          data: {
            matchCount: { increment: 1 },
            lastMatched: new Date()
          }
        })
      } else if (type === 'blacklist') {
        await db.blacklistedItem.update({
          where: { id: ruleId },
          data: {
            matchCount: { increment: 1 },
            lastMatched: new Date()
          }
        })
      } else if (type === 'whitelist') {
        await db.whitelistedItem.update({
          where: { id: ruleId },
          data: {
            matchCount: { increment: 1 },
            lastMatched: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Update match count error:', error)
    }
  }

  /**
   * Update pattern match count
   */
  private async updatePatternMatchCount(patternId: string): Promise<void> {
    try {
      await db.blacklistPattern.update({
        where: { id: patternId },
        data: {
          matchCount: { increment: 1 },
          lastMatched: new Date()
        }
      })
    } catch (error) {
      console.error('Update pattern match count error:', error)
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): FilterMetrics {
    return { ...this.metrics }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: this.metrics.cacheHitRate
    }
  }
}

// Singleton instance
export const contentFilter = new ContentFilterEngine()
export default contentFilter