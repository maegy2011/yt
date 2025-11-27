/**
 * @jest-environment jsdom
 */

import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/favorites/route'
import { db } from '@/lib/db'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    favoriteVideo: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}))

describe('/api/favorites', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GET /api/favorites', () => {
    it('should return favorites list with status 200', async () => {
      // Arrange
      const mockFavorites = [
        {
          id: '1',
          videoId: 'video1',
          title: 'Test Video 1',
          channelName: 'Test Channel 1',
          thumbnail: 'thumb1.jpg',
          duration: '10:00',
          viewCount: 1000,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          videoId: 'video2',
          title: 'Test Video 2',
          channelName: 'Test Channel 2',
          thumbnail: 'thumb2.jpg',
          duration: '5:00',
          viewCount: 500,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      ;(db.favoriteVideo.findMany as jest.Mock).mockResolvedValue(mockFavorites)

      const { req } = createMocks({
        method: 'GET',
        query: { limit: '10', offset: '0' },
      })

      // Act
      const response = await GET(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.items).toEqual(mockFavorites)
      expect(data.total).toBe(mockFavorites.length)
      expect(db.favoriteVideo.findMany).toHaveBeenCalledWith({
        orderBy: { addedAt: 'desc' },
        take: 10,
        skip: 0,
      })
    })

    it('should handle pagination correctly', async () => {
      // Arrange
      const mockFavorites = [
        { id: '1', videoId: 'video1', title: 'Video 1' },
        { id: '2', videoId: 'video2', title: 'Video 2' },
      ]

      ;(db.favoriteVideo.findMany as jest.Mock).mockResolvedValue(mockFavorites)
      ;(db.favoriteVideo.count as jest.Mock).mockResolvedValue({ _all: 2 })

      const { req } = createMocks({
        method: 'GET',
        query: { limit: '5', offset: '10' },
      })

      // Act
      const response = await GET(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(db.favoriteVideo.findMany).toHaveBeenCalledWith({
        orderBy: { addedAt: 'desc' },
        take: 5,
        skip: 10,
      })
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database connection failed'
      ;(db.favoriteVideo.findMany as jest.Mock).mockRejectedValue(new Error(errorMessage))

      const { req } = createMocks({ method: 'GET' })

      // Act
      const response = await GET(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch favorites')
    })

    it('should validate query parameters', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'GET',
        query: { limit: 'invalid', offset: 'invalid' },
      })

      // Act
      const response = await GET(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid query parameters')
    })
  })

  describe('POST /api/favorites', () => {
    const validFavoriteData = {
      videoId: 'test-video-id',
      title: 'Test Video',
      channelName: 'Test Channel',
      thumbnail: 'test-thumbnail.jpg',
      duration: '10:00',
      viewCount: 1000,
    }

    it('should create a new favorite with valid data', async () => {
      // Arrange
      const mockCreatedFavorite = {
        id: 'new-id',
        ...validFavoriteData,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(db.favoriteVideo.findUnique as jest.Mock).mockResolvedValue(null) // Video doesn't exist
      ;(db.favoriteVideo.create as jest.Mock).mockResolvedValue(mockCreatedFavorite)

      const { req } = createMocks({
        method: 'POST',
        body: validFavoriteData,
        headers: { 'content-type': 'application/json' },
      })

      // Act
      const response = await POST(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.item).toEqual(mockCreatedFavorite)
      expect(db.favoriteVideo.create).toHaveBeenCalledWith({
        data: validFavoriteData,
      })
    })

    it('should return 409 for duplicate favorite', async () => {
      // Arrange
      const existingFavorite = {
        id: 'existing-id',
        videoId: 'test-video-id',
        title: 'Existing Video',
      }

      ;(db.favoriteVideo.findUnique as jest.Mock).mockResolvedValue(existingFavorite)

      const { req } = createMocks({
        method: 'POST',
        body: validFavoriteData,
        headers: { 'content-type': 'application/json' },
      })

      // Act
      const response = await POST(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Video already in favorites')
      expect(db.favoriteVideo.create).not.toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {
        title: 'Test Video',
        // Missing required fields
      }

      const { req } = createMocks({
        method: 'POST',
        body: invalidData,
        headers: { 'content-type': 'application/json' },
      })

      // Act
      const response = await POST(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('videoId is required')
      expect(db.favoriteVideo.create).not.toHaveBeenCalled()
    })

    it('should handle malformed JSON', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'POST',
        body: 'invalid json',
        headers: { 'content-type': 'application/json' },
      })

      // Act
      const response = await POST(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should sanitize input data', async () => {
      // Arrange
      const unsanitizedData = {
        videoId: 'test-video-id',
        title: '<script>alert("xss")</script>Test Video',
        channelName: 'Test Channel',
        thumbnail: 'test-thumbnail.jpg',
        duration: '10:00',
        viewCount: 1000,
      }

      const sanitizedData = {
        ...unsanitizedData,
        title: 'Test Video', // Script tag should be removed
      }

      ;(db.favoriteVideo.findUnique as jest.Mock).mockResolvedValue(null)
      ;(db.favoriteVideo.create as jest.Mock).mockResolvedValue({ id: 'new-id', ...sanitizedData })

      const { req } = createMocks({
        method: 'POST',
        body: unsanitizedData,
        headers: { 'content-type': 'application/json' },
      })

      // Act
      const response = await POST(req as NextRequest)

      // Assert
      expect(response.status).toBe(201)
      expect(db.favoriteVideo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: sanitizedData.title, // Should be sanitized
        }),
      })
    })
  })

  describe('DELETE /api/favorites', () => {
    it('should delete a favorite by video ID', async () => {
      // Arrange
      const videoId = 'test-video-id'
      const mockFavorite = {
        id: 'favorite-id',
        videoId,
        title: 'Test Video',
      }

      ;(db.favoriteVideo.findUnique as jest.Mock).mockResolvedValue(mockFavorite)
      ;(db.favoriteVideo.delete as jest.Mock).mockResolvedValue(mockFavorite)

      const { req } = createMocks({
        method: 'DELETE',
        query: { videoId },
      })

      // Act
      const response = await DELETE(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('removed from favorites')
      expect(db.favoriteVideo.delete).toHaveBeenCalledWith({
        where: { videoId },
      })
    })

    it('should return 404 for non-existent favorite', async () => {
      // Arrange
      const videoId = 'non-existent-video'
      ;(db.favoriteVideo.findUnique as jest.Mock).mockResolvedValue(null)

      const { req } = createMocks({
        method: 'DELETE',
        query: { videoId },
      })

      // Act
      const response = await DELETE(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Favorite not found')
      expect(db.favoriteVideo.delete).not.toHaveBeenCalled()
    })

    it('should validate video ID parameter', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'DELETE',
        query: {}, // Missing videoId
      })

      // Act
      const response = await DELETE(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('videoId is required')
    })

    it('should handle database errors during deletion', async () => {
      // Arrange
      const videoId = 'test-video-id'
      const errorMessage = 'Database deletion failed'

      ;(db.favoriteVideo.findUnique as jest.Mock).mockResolvedValue({ id: 'favorite-id', videoId })
      ;(db.favoriteVideo.delete as jest.Mock).mockRejectedValue(new Error(errorMessage))

      const { req } = createMocks({
        method: 'DELETE',
        query: { videoId },
      })

      // Act
      const response = await DELETE(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to remove favorite')
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected database error')
      ;(db.favoriteVideo.findMany as jest.Mock).mockImplementation(() => {
        throw unexpectedError
      })

      const { req } = createMocks({ method: 'GET' })

      // Act
      const response = await GET(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle network timeouts', async () => {
      // Arrange
      ;(db.favoriteVideo.findMany as jest.Mock).mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100)
        })
      })

      const { req } = createMocks({ method: 'GET' })

      // Act
      const response = await GET(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('Security', () => {
    it('should handle large payloads gracefully', async () => {
      // Arrange
      const largePayload = {
        videoId: 'x'.repeat(10000), // Very large videoId
        title: 'Test Video',
        channelName: 'Test Channel',
        thumbnail: 'test-thumbnail.jpg',
        duration: '10:00',
        viewCount: 1000,
      }

      const { req } = createMocks({
        method: 'POST',
        body: largePayload,
        headers: { 'content-type': 'application/json' },
      })

      // Act
      const response = await POST(req as NextRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Payload too large')
    })

    it('should prevent SQL injection attempts', async () => {
      // Arrange
      const maliciousPayload = {
        videoId: "'; DROP TABLE favoriteVideo; --",
        title: 'Malicious Video',
        channelName: 'Test Channel',
        thumbnail: 'test-thumbnail.jpg',
        duration: '10:00',
        viewCount: 1000,
      }

      const { req } = createMocks({
        method: 'POST',
        body: maliciousPayload,
        headers: { 'content-type': 'application/json' },
      })

      // Act
      const response = await POST(req as NextRequest)

      // Assert
      // Should not cause database errors due to SQL injection
      expect(response.status).toBe(400)
      expect(db.favoriteVideo.create).not.toHaveBeenCalledWith({
        data: expect.objectContaining({
          videoId: expect.stringContaining('DROP TABLE'),
        }),
      })
    })
  })
})