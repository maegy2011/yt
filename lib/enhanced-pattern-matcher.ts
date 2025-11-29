import { distance } from 'fast-levenshtein'

export interface AdvancedPattern {
  id: string
  pattern: string
  type: 'keyword' | 'regex' | 'wildcard' | 'fuzzy' | 'semantic'
  weight: number // 0-1 for importance
  context: 'title' | 'description' | 'tags' | 'transcript'
  isEnabled: boolean
  matchThreshold?: number // For fuzzy/semantic matching
}

export interface PatternMatchResult {
  matched: boolean
  score: number // 0-1 confidence score
  pattern?: AdvancedPattern
  matchedText?: string
}

export class EnhancedPatternMatcher {
  // Fuzzy matching with configurable threshold
  static fuzzyMatch(text: string, pattern: string, threshold = 0.8): PatternMatchResult {
    if (!text || !pattern) {
      return { matched: false, score: 0 }
    }

    const textLower = text.toLowerCase()
    const patternLower = pattern.toLowerCase()
    
    // Exact match gets highest score
    if (textLower === patternLower) {
      return { matched: true, score: 1.0, matchedText: text }
    }

    // Contains match gets high score
    if (textLower.includes(patternLower) || patternLower.includes(textLower)) {
      return { matched: true, score: 0.9, matchedText: text }
    }

    // Levenshtein distance for fuzzy matching
    const maxDistance = Math.max(textLower.length, patternLower.length)
    const editDistance = distance(textLower, patternLower)
    const similarity = 1 - (editDistance / maxDistance)
    
    const matched = similarity >= threshold
    const score = matched ? similarity : 0

    return { matched, score, matchedText: matched ? text : undefined }
  }

  // Semantic matching using keyword extraction and scoring
  static semanticMatch(text: string, pattern: string, threshold = 0.7): PatternMatchResult {
    if (!text || !pattern) {
      return { matched: false, score: 0 }
    }

    const textWords = text.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    const patternWords = pattern.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    
    if (textWords.length === 0 || patternWords.length === 0) {
      return { matched: false, score: 0 }
    }

    // Calculate word overlap ratio
    const commonWords = textWords.filter(word => patternWords.includes(word))
    const overlapRatio = commonWords.length / Math.max(textWords.length, patternWords.length)
    
    // Bonus for exact phrase matches
    const exactPhraseBonus = text.toLowerCase().includes(pattern.toLowerCase()) ? 0.3 : 0
    
    const score = Math.min(overlapRatio + exactPhraseBonus, 1.0)
    const matched = score >= threshold

    return { matched, score, matchedText: matched ? text : undefined }
  }

  // Advanced wildcard matching with multiple wildcard types
  static advancedWildcardMatch(text: string, pattern: string): PatternMatchResult {
    if (!text || !pattern) {
      return { matched: false, score: 0 }
    }

    const textLower = text.toLowerCase()
    const patternLower = pattern.toLowerCase()

    // Standard wildcard conversion
    let regexPattern = patternLower
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\+/g, '.+')
      .replace(/\{([^}]+)\}/g, '($1)') // Optional groups

    try {
      const regex = new RegExp(`^${regexPattern}$`, 'i')
      const matched = regex.test(textLower)
      
      // Calculate score based on pattern complexity
      let score = 0.5 // Base score for wildcard matches
      
      if (patternLower.includes('*')) score += 0.2
      if (patternLower.includes('?')) score += 0.1
      if (patternLower.includes('+')) score += 0.15
      if (patternLower.includes('{')) score += 0.15
      
      score = Math.min(score, 1.0)

      return { matched, score, matchedText: matched ? text : undefined }
    } catch (error) {
      // Invalid regex pattern
      return { matched: false, score: 0 }
    }
  }

  // Multi-pattern matching with scoring
  static matchPatterns(
    text: string, 
    patterns: AdvancedPattern[], 
    context?: string
  ): PatternMatchResult {
    if (!text || patterns.length === 0) {
      return { matched: false, score: 0 }
    }

    let bestMatch: PatternMatchResult = { matched: false, score: 0 }
    let matchedPattern: AdvancedPattern | undefined

    for (const pattern of patterns) {
      if (!pattern.isEnabled) continue

      let currentMatch: PatternMatchResult
      let textToMatch = text

      // Select appropriate text based on context
      if (context && pattern.context !== context) {
        continue // Skip if context doesn't match
      }

      switch (pattern.type) {
        case 'keyword':
          currentMatch = this.keywordMatch(textToMatch, pattern.pattern)
          break

        case 'fuzzy':
          currentMatch = this.fuzzyMatch(
            textToMatch, 
            pattern.pattern, 
            pattern.matchThreshold || 0.8
          )
          break

        case 'semantic':
          currentMatch = this.semanticMatch(
            textToMatch, 
            pattern.pattern, 
            pattern.matchThreshold || 0.7
          )
          break

        case 'wildcard':
          currentMatch = this.advancedWildcardMatch(textToMatch, pattern.pattern)
          break

        case 'regex':
          currentMatch = this.regexMatch(textToMatch, pattern.pattern)
          break

        default:
          currentMatch = this.keywordMatch(textToMatch, pattern.pattern)
      }

      // Apply pattern weight
      currentMatch.score *= pattern.weight

      if (currentMatch.score > bestMatch.score) {
        bestMatch = currentMatch
        matchedPattern = pattern
      }
    }

    return {
      ...bestMatch,
      pattern: matchedPattern
    }
  }

  // Safe regex matching with validation
  static regexMatch(text: string, pattern: string): PatternMatchResult {
    if (!text || !pattern) {
      return { matched: false, score: 0 }
    }

    try {
      // Validate regex pattern for security
      if (this.isUnsafeRegex(pattern)) {
        return { matched: false, score: 0 }
      }

      const regex = new RegExp(pattern, 'i')
      const matched = regex.test(text)
      
      return { 
        matched, 
        score: matched ? 0.8 : 0, // High score for regex matches
        matchedText: matched ? text : undefined 
      }
    } catch (error) {
      return { matched: false, score: 0 }
    }
  }

  // Simple keyword matching with scoring
  static keywordMatch(text: string, pattern: string): PatternMatchResult {
    if (!text || !pattern) {
      return { matched: false, score: 0 }
    }

    const textLower = text.toLowerCase()
    const patternLower = pattern.toLowerCase()

    // Exact match gets highest score
    if (textLower === patternLower) {
      return { matched: true, score: 1.0, matchedText: text }
    }

    // Contains match gets medium score
    if (textLower.includes(patternLower)) {
      return { matched: true, score: 0.7, matchedText: text }
    }

    // Word boundary match gets lower score
    const wordRegex = new RegExp(`\\b${this.escapeRegex(patternLower)}\\b`, 'i')
    if (wordRegex.test(textLower)) {
      return { matched: true, score: 0.5, matchedText: text }
    }

    return { matched: false, score: 0 }
  }

  // Check for unsafe regex patterns
  static isUnsafeRegex(pattern: string): boolean {
    const unsafePatterns = [
      /\(\?=/,   // Lookahead
      /\(\?!/,   // Negative lookahead
      /\(\*/,    // Atomic group
      /\{.*\}/,  // Quantifier abuse
      /\(\?=.*\)\*/, // Catastrophic backtracking
      /(.+)\1/,  // Backreference abuse
    ]

    return unsafePatterns.some(unsafePattern => unsafePattern.test(pattern))
  }

  // Escape regex special characters
  static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  // Batch pattern matching for multiple texts
  static batchMatchPatterns(
    texts: string[], 
    patterns: AdvancedPattern[], 
    context?: string
  ): Array<{ text: string; result: PatternMatchResult }> {
    return texts.map(text => ({
      text,
      result: this.matchPatterns(text, patterns, context)
    }))
  }

  // Pattern performance testing
  static testPatternPerformance(
    patterns: AdvancedPattern[],
    testTexts: string[]
  ): { patternId: string; avgTime: number; matchRate: number }[] {
    const results: { patternId: string; avgTime: number; matchRate: number }[] = []

    for (const pattern of patterns) {
      const times: number[] = []
      let matches = 0

      for (const text of testTexts) {
        const startTime = performance.now()
        const result = this.matchPatterns(text, [pattern])
        const endTime = performance.now()
        
        times.push(endTime - startTime)
        if (result.matched) matches++
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const matchRate = matches / testTexts.length

      results.push({
        patternId: pattern.id,
        avgTime,
        matchRate
      })
    }

    return results.sort((a, b) => b.matchRate - a.matchRate)
  }
}