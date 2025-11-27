/**
 * @jest-environment jsdom
 */

import {
  sanitizeString,
  validateSearchQuery,
  validateVideoId,
  validateChannelId,
  validateNoteContent,
  validateNumericInput,
  validateTimeInput,
  validateRequestBody,
} from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    it('should handle null and undefined inputs', () => {
      expect(sanitizeString(null)).toBe('')
      expect(sanitizeString(undefined)).toBe('')
    })

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world')
    })

    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>hello')).toBe('alerthello')
      expect(sanitizeString('<div>content</div>')).toBe('content')
    })

    it('should remove javascript protocol', () => {
      expect(sanitizeString('javascript:alert("xss")')).toBe('alert("xss")')
      expect(sanitizeString('JAVASCRIPT:alert("xss")')).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick="alert("xss")')).toBe('')
      expect(sanitizeString('onload="malicious()"')).toBe('')
      expect(sanitizeString('onError="alert()"')).toBe('')
    })

    it('should respect maxLength', () => {
      expect(sanitizeString('a'.repeat(100), 50)).toBe('a'.repeat(50))
      expect(sanitizeString('short text', 50)).toBe('short text')
    })

    it('should handle normal text', () => {
      expect(sanitizeString('Normal text content')).toBe('Normal text content')
      expect(sanitizeString('Video Title - Episode 1')).toBe('Video Title - Episode 1')
    })
  })

  describe('validateSearchQuery', () => {
    it('should reject empty queries', () => {
      const result = validateSearchQuery('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Search query cannot be empty')
    })

    it('should reject null/undefined queries', () => {
      expect(validateSearchQuery(null).isValid).toBe(false)
      expect(validateSearchQuery(undefined).isValid).toBe(false)
      expect(validateSearchQuery(false as any).isValid).toBe(false)
    })

    it('should reject queries that are too long', () => {
      const longQuery = 'a'.repeat(201)
      const result = validateSearchQuery(longQuery)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Search query is too long (max 200 characters)')
    })

    it('should reject queries with dangerous content', () => {
      const dangerousQueries = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'onclick="alert()"',
        'data:text/html,<script>alert("xss")</script>',
      ]

      dangerousQueries.forEach(query => {
        const result = validateSearchQuery(query)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Search query contains invalid characters')
      })
    })

    it('should accept valid queries', () => {
      const validQueries = [
        'test video',
        'Tutorial: How to code',
        'Music video - official',
        'Documentary 2023',
        'React hooks tutorial',
      ]

      validQueries.forEach(query => {
        const result = validateSearchQuery(query)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe(query.trim())
      })
    })

    it('should sanitize valid queries', () => {
      const result = validateSearchQuery('  <b>test</b> video  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('test video')
    })
  })

  describe('validateVideoId', () => {
    it('should reject empty video IDs', () => {
      expect(validateVideoId('').isValid).toBe(false)
      expect(validateVideoId('   ').isValid).toBe(false)
      expect(validateVideoId(null).isValid).toBe(false)
      expect(validateVideoId(undefined).isValid).toBe(false)
    })

    it('should reject video IDs with invalid length', () => {
      expect(validateVideoId('short').isValid).toBe(false)
      expect(validateVideoId('a'.repeat(21)).isValid).toBe(false)
    })

    it('should reject video IDs with invalid characters', () => {
      const invalidIds = [
        'video@id',
        'video#id',
        'video id',
        'video/id',
        'video.id',
        'video,id',
      ]

      invalidIds.forEach(id => {
        const result = validateVideoId(id)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Video ID contains invalid characters')
      })
    })

    it('should accept valid YouTube video IDs', () => {
      const validIds = [
        'dQw4w9WgXcQ',
        'jNQXAC9IVRw',
        '9bZkp7q19f0',
        'abc123xyz',
        'video_id_test',
      ]

      validIds.forEach(id => {
        const result = validateVideoId(id)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe(id)
      })
    })
  })

  describe('validateChannelId', () => {
    it('should reject empty channel IDs', () => {
      expect(validateChannelId('').isValid).toBe(false)
      expect(validateChannelId(null).isValid).toBe(false)
      expect(validateChannelId(undefined).isValid).toBe(false)
    })

    it('should reject channel IDs with invalid length', () => {
      expect(validateChannelId('ab').isValid).toBe(false)
      expect(validateChannelId('a'.repeat(101)).isValid).toBe(false)
    })

    it('should reject channel IDs with invalid characters', () => {
      const invalidIds = [
        'channel@id',
        'channel#id',
        'channel id',
        'channel/id',
        'channel.id',
      ]

      invalidIds.forEach(id => {
        const result = validateChannelId(id)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Channel ID contains invalid characters')
      })
    })

    it('should accept valid channel IDs', () => {
      const validIds = [
        'UCBR8-60BW-67yoaAxy9k9',
        'channel_name',
        'channel-123',
        'user_channel',
        'mychannel123',
      ]

      validIds.forEach(id => {
        const result = validateChannelId(id)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe(id)
      })
    })
  })

  describe('validateNoteContent', () => {
    it('should reject empty title', () => {
      const result = validateNoteContent('', 'Some comment')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Note title is required')
    })

    it('should accept valid title and comment', () => {
      const result = validateNoteContent('My Note Title', 'This is my comment')
      expect(result.isValid).toBe(true)
      expect(result.sanitized.title).toBe('My Note Title')
      expect(result.sanitized.comment).toBe('This is my comment')
    })

    it('should sanitize title and comment', () => {
      const result = validateNoteContent(
        '<script>alert("xss")</script>Note Title',
        'Comment with <b>HTML</b> tags'
      )
      expect(result.isValid).toBe(true)
      expect(result.sanitized.title).toBe('Note Title')
      expect(result.sanitized.comment).toBe('Comment with HTML tags')
    })
  })

  describe('validateNumericInput', () => {
    it('should handle null/undefined/empty values', () => {
      const result = validateNumericInput(null)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(null)
    })

    it('should reject non-numeric values', () => {
      const invalidValues = ['abc', '12.34.56', '12a34', NaN, Infinity]
      
      invalidValues.forEach(value => {
        const result = validateNumericInput(value)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('must be a valid number')
      })
    })

    it('should reject negative numbers', () => {
      const result = validateNumericInput(-5)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot be negative')
    })

    it('should reject numbers that are too large', () => {
      const result = validateNumericInput(Number.MAX_SAFE_INTEGER + 1)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('is too large')
    })

    it('should accept valid numbers', () => {
      const validNumbers = [0, 1, 100, 999999, Number.MAX_SAFE_INTEGER]
      
      validNumbers.forEach(num => {
        const result = validateNumericInput(num)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe(num)
      })
    })

    it('should use custom field name in error messages', () => {
      const result = validateNumericInput('invalid', 'View Count')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('View Count must be a valid number')
    })
  })

  describe('validateTimeInput', () => {
    it('should handle null/undefined/empty values', () => {
      const result = validateTimeInput(null)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(0)
    })

    it('should reject non-numeric values', () => {
      const result = validateTimeInput('invalid')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('must be a valid number')
    })

    it('should reject negative values', () => {
      const result = validateTimeInput(-5)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot be negative')
    })

    it('should reject values exceeding 12 hours', () => {
      const result = validateTimeInput(43201) // 12 hours + 1 second
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('cannot exceed 12 hours')
    })

    it('should accept valid time values', () => {
      const validTimes = [0, 30, 120, 3600, 43200] // 0s, 30s, 2m, 1h, 12h
      
      validTimes.forEach(time => {
        const result = validateTimeInput(time)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe(time)
      })
    })

    it('should floor decimal values', () => {
      const result = validateTimeInput(125.7)
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe(125)
    })
  })

  describe('validateRequestBody', () => {
    it('should reject null/undefined bodies', () => {
      expect(validateRequestBody(null).isValid).toBe(false)
      expect(validateRequestBody(undefined).isValid).toBe(false)
    })

    it('should reject non-object bodies', () => {
      const invalidBodies = ['string', 123, true, []]
      
      invalidBodies.forEach(body => {
        const result = validateRequestBody(body)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Invalid request body')
      })
    })

    it('should reject missing required fields', () => {
      const body = { title: 'Test' }
      const requiredFields = ['title', 'videoId', 'channelName']
      
      const result = validateRequestBody(body, requiredFields)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Missing required field: videoId')
    })

    it('should reject null/undefined required fields', () => {
      const body = { title: 'Test', videoId: null, channelName: undefined }
      const requiredFields = ['title', 'videoId', 'channelName']
      
      const result = validateRequestBody(body, requiredFields)
      expect(result.isValid).toBe(false)
    })

    it('should accept valid body with all required fields', () => {
      const body = {
        title: 'Test Video',
        videoId: 'test123',
        channelName: 'Test Channel',
      }
      const requiredFields = ['title', 'videoId', 'channelName']
      
      const result = validateRequestBody(body, requiredFields)
      expect(result.isValid).toBe(true)
    })

    it('should accept body with extra fields', () => {
      const body = {
        title: 'Test Video',
        videoId: 'test123',
        channelName: 'Test Channel',
        extraField: 'extra value',
        anotherField: 123,
      }
      const requiredFields = ['title', 'videoId', 'channelName']
      
      const result = validateRequestBody(body, requiredFields)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Edge Cases and Security', () => {
    it('should handle Unicode characters correctly', () => {
      const unicodeInputs = [
        '测试视频', // Chinese
        'видео', // Russian
        'فيديو', // Arabic
        'ビデオ', // Japanese
        '🎥 Video Title', // Emoji
      ]

      unicodeInputs.forEach(input => {
        const result = validateSearchQuery(input)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBe(input.trim())
      })
    })

    it('should prevent XSS attempts', () => {
      const xssAttempts = [
        '<img src=x onerror=alert("XSS")>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '"><iframe onload=alert("XSS")></iframe>',
      ]

      xssAttempts.forEach(attempt => {
        const searchResult = validateSearchQuery(attempt)
        expect(searchResult.isValid).toBe(false)
        expect(searchResult.sanitized).not.toContain('<script>')
        expect(searchResult.sanitized).not.toContain('javascript:')
        expect(searchResult.sanitized).not.toContain('onerror=')
        expect(searchResult.sanitized).not.toContain('onload=')
      })
    })

    it('should handle extremely long inputs gracefully', () => {
      const extremelyLong = 'a'.repeat(10000)
      const result = sanitizeString(extremelyLong, 100)
      
      expect(result).toBe('a'.repeat(100))
      expect(result.length).toBe(100)
    })

    it('should handle special characters in IDs', () => {
      const specialChars = [
        '!@#$%^&*()_+-=[]{}|;:",.<>?/~`',
      ]

      specialChars.forEach(char => {
        const videoResult = validateVideoId(`video${char}id`)
        const channelResult = validateChannelId(`channel${char}id`)
        
        // Only underscore and hyphen should be valid
        if (char === '_' || char === '-') {
          expect(videoResult.isValid).toBe(true)
          expect(channelResult.isValid).toBe(true)
        } else {
          expect(videoResult.isValid).toBe(false)
          expect(channelResult.isValid).toBe(false)
        }
      })
    })
  })

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      const largeInput = 'a'.repeat(10000)
      const startTime = performance.now()
      
      const result = sanitizeString(largeInput)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(result).toBe('a'.repeat(1000)) // Limited to maxLength
      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should handle many validations quickly', () => {
      const inputs = Array.from({ length: 1000 }, (_, i) => `test${i}`)
      const startTime = performance.now()
      
      const results = inputs.map(input => validateSearchQuery(input))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(results.every(result => result.isValid)).toBe(true)
      expect(duration).toBeLessThan(500) // Should complete within 500ms
    })
  })
})