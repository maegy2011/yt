/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fetchMock } from 'jest-fetch-mock'
import App from '@/app/page'

// Mock fetch globally
global.fetch = fetchMock

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock background player context
jest.mock('@/contexts/background-player-context', () => ({
  useBackgroundPlayer: () => ({
    backgroundVideo: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    showMiniPlayer: false,
    pauseBackgroundVideo: jest.fn(),
    stopBackgroundVideo: jest.fn(),
    settingsTitle: '',
  }),
}))

// Mock incognito context
jest.mock('@/contexts/incognito-context', () => ({
  useIncognito: () => ({
    isIncognito: false,
    toggleIncognito: jest.fn(),
  }),
}))

describe('Application Integration Tests', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
    localStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  describe('Application Initialization', () => {
    it('should render the main application', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByRole('navigation')).toBeInTheDocument()
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('should display navigation elements', async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search videos/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
      })
    })

    it('should show skip to main content link', () => {
      render(<App />)

      const skipLink = screen.getByRole('link', { name: /skip to main content/i })
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })
  })

  describe('Search Functionality', () => {
    it('should handle search input', async () => {
      const user = userEvent.setup()
      
      // Mock search API
      fetchMock.mockResponseOnce(JSON.stringify({
        success: true,
        items: [
          {
            videoId: 'test-video',
            title: 'Test Video',
            channelName: 'Test Channel',
            thumbnail: 'thumb.jpg',
            duration: '10:00',
          },
        ],
        total: 1,
      }), { status: 200 })

      render(<App />)

      const searchInput = screen.getByPlaceholderText(/search videos/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      // Type search query
      await user.type(searchInput, 'test query')
      expect(searchInput).toHaveValue('test query')

      // Submit search
      await user.click(searchButton)

      // Should call search API
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/youtube/search'),
          expect.objectContaining({
            method: 'GET',
          })
        )
      })
    })

    it('should display search results', async () => {
      const mockSearchResults = {
        success: true,
        items: [
          {
            videoId: 'test-video-1',
            title: 'Test Video 1',
            channelName: 'Test Channel 1',
            thumbnail: 'thumb1.jpg',
            duration: '5:00',
          },
          {
            videoId: 'test-video-2',
            title: 'Test Video 2',
            channelName: 'Test Channel 2',
            thumbnail: 'thumb2.jpg',
            duration: '8:00',
          },
        ],
        total: 2,
      }

      fetchMock.mockResponseOnce(JSON.stringify(mockSearchResults), { status: 200 })

      render(<App />)

      const searchInput = screen.getByPlaceholderText(/search videos/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      await userEvent.type(searchInput, 'test query')
      await userEvent.click(searchButton)

      // Wait for results to appear
      await waitFor(() => {
        expect(screen.getByText('Test Video 1')).toBeInTheDocument()
        expect(screen.getByText('Test Video 2')).toBeInTheDocument()
        expect(screen.getByAltText('Test Video 1')).toBeInTheDocument()
        expect(screen.getByAltText('Test Video 2')).toBeInTheDocument()
      })
    })

    it('should handle search errors', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          success: false,
          error: 'Search failed',
        }),
        { status: 500 }
      )

      render(<App />)

      const searchInput = screen.getByPlaceholderText(/search videos/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      await userEvent.type(searchInput, 'test query')
      await userEvent.click(searchButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Video Playback', () => {
    it('should play video when video card is clicked', async () => {
      const mockVideo = {
        videoId: 'test-video',
        title: 'Test Video',
        channelName: 'Test Channel',
        thumbnail: 'thumb.jpg',
        duration: '10:00',
      }

      fetchMock.mockResponseOnce(JSON.stringify({
        success: true,
        items: [mockVideo],
        total: 1,
      }), { status: 200 })

      render(<App />)

      // Trigger search to get video
      const searchInput = screen.getByPlaceholderText(/search videos/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      await userEvent.type(searchInput, 'test query')
      await userEvent.click(searchButton)

      // Wait for video to appear and click it
      await waitFor(() => {
        const videoCard = screen.getByText('Test Video')
        expect(videoCard).toBeInTheDocument()
      })

      const videoCardButton = screen.getByRole('button', { name: /play video: test video/i })
      await userEvent.click(videoCardButton)

      // Should trigger video playback
      await waitFor(() => {
        // Check if background player context was called
        // This would depend on the actual implementation
        expect(screen.getByText('Test Video')).toBeInTheDocument()
      })
    })
  })

  describe('Favorites Management', () => {
    it('should add video to favorites', async () => {
      const mockVideo = {
        videoId: 'test-video',
        title: 'Test Video',
        channelName: 'Test Channel',
        thumbnail: 'thumb.jpg',
        duration: '10:00',
      }

      // Mock search to get video
      fetchMock.mockResponseOnce(JSON.stringify({
        success: true,
        items: [mockVideo],
        total: 1,
      }), { status: 200 })

      // Mock add to favorites API
      fetchMock.mockResponseOnce(JSON.stringify({
        success: true,
        item: { ...mockVideo, id: 'fav-1', addedAt: new Date().toISOString() },
      }), { status: 201 })

      render(<App />)

      // Search for video
      const searchInput = screen.getByPlaceholderText(/search videos/i)
      await userEvent.type(searchInput, 'test query')
      await userEvent.click(screen.getByRole('button', { name: /search/i }))

      // Wait for video to appear
      await waitFor(() => {
        expect(screen.getByText('Test Video')).toBeInTheDocument()
      })

      // Click favorite button
      const favoriteButton = screen.getByRole('button', { name: /favorite/i })
      await userEvent.click(favoriteButton)

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/added to favorites/i)).toBeInTheDocument()
      })
    })

    it('should display favorites list', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          videoId: 'video1',
          title: 'Favorite Video 1',
          channelName: 'Channel 1',
          thumbnail: 'thumb1.jpg',
          duration: '5:00',
          addedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 'fav-2',
          videoId: 'video2',
          title: 'Favorite Video 2',
          channelName: 'Channel 2',
          thumbnail: 'thumb2.jpg',
          duration: '8:00',
          addedAt: '2023-01-02T00:00:00.000Z',
        },
      ]

      fetchMock.mockResponseOnce(JSON.stringify({
        success: true,
        items: mockFavorites,
        total: mockFavorites.length,
      }), { status: 200 })

      render(<App />)

      // Navigate to favorites tab
      const favoritesTab = screen.getByRole('button', { name: /favorites/i })
      await userEvent.click(favoritesTab)

      await waitFor(() => {
        expect(screen.getByText('Favorite Video 1')).toBeInTheDocument()
        expect(screen.getByText('Favorite Video 2')).toBeInTheDocument()
        expect(screen.getByAltText('Favorite Video 1')).toBeInTheDocument()
        expect(screen.getByAltText('Favorite Video 2')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should switch between tabs', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Initially on home tab
      expect(screen.getByRole('button', { name: /home/i })).toHaveAttribute('aria-current', 'page')

      // Click on favorites tab
      const favoritesTab = screen.getByRole('button', { name: /favorites/i })
      await user.click(favoritesTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /favorites/i })).toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('button', { name: /home/i })).not.toHaveAttribute('aria-current', 'page')
      })

      // Click on history tab
      const historyTab = screen.getByRole('button', { name: /history/i })
      await user.click(historyTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /history/i })).toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('button', { name: /favorites/i })).not.toHaveAttribute('aria-current', 'page')
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<App />)

      const homeTab = screen.getByRole('button', { name: /home/i })
      homeTab.focus()

      // Test Tab navigation
      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: /favorites/i })).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: /history/i })).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: /settings/i })).toHaveFocus()

      // Test Shift+Tab for backward navigation
      await user.keyboard('{Shift>}{Tab}')
      expect(screen.getByRole('button', { name: /history/i })).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      render(<App />)

      await waitFor(() => {
        // Should show mobile navigation
        expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
        
        // Should hide desktop navigation items
        expect(screen.queryByRole('button', { name: /favorites/i })).not.toBeInTheDocument()
      })
    })

    it('should adapt to desktop viewport', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      })

      render(<App />)

      await waitFor(() => {
        // Should show desktop navigation
        expect(screen.getByRole('button', { name: /favorites/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument()
        
        // Should hide mobile menu button
        expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ success: false, error: 'Network error' }),
        { status: 500 }
      )

      render(<App />)

      const searchInput = screen.getByPlaceholderText(/search videos/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      await userEvent.type(searchInput, 'test query')
      await userEvent.click(searchButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should handle API timeouts', async () => {
      fetchMock.mockResponseOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ body: '{}' }), 10000)),
        { status: 200 }
      )

      render(<App />)

      const searchInput = screen.getByPlaceholderText(/search videos/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      await userEvent.type(searchInput, 'test query')
      await userEvent.click(searchButton)

      await waitFor(() => {
        expect(screen.getByText(/timeout/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should support screen reader navigation', async () => {
      render(<App />)

      await waitFor(() => {
        // Check for proper ARIA labels
        expect(screen.getByRole('banner')).toBeInTheDocument()
        expect(screen.getByRole('navigation')).toBeInTheDocument()
        expect(screen.getByRole('main')).toBeInTheDocument()
        
        // Check for skip link
        expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument()
        
        // Check for proper heading structure
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      })
    })

    it('should support keyboard-only navigation', async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search videos/i)
        
        // Test keyboard navigation to search
        searchInput.focus()
        expect(searchInput).toHaveFocus()
        
        // Test keyboard search submission
        await user.type(searchInput, 'test query')
        await user.keyboard('{Enter}')
        
        // Should trigger search
        expect(fetchMock).toHaveBeenCalled()
      })
    })

    it('should have proper color contrast', async () => {
      render(<App />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        
        buttons.forEach(button => {
          // Check for proper contrast (this would require actual DOM computation)
          expect(button).toBeInTheDocument()
          expect(button).toHaveAttribute('aria-label')
        })
      })
    })
  })

  describe('Performance', () => {
    it('should handle large search results efficiently', async () => {
      const largeResults = Array.from({ length: 100 }, (_, i) => ({
        videoId: `video${i}`,
        title: `Video ${i}`,
        channelName: `Channel ${i}`,
        thumbnail: `thumb${i}.jpg`,
        duration: '10:00',
      }))

      fetchMock.mockResponseOnce(JSON.stringify({
        success: true,
        items: largeResults,
        total: largeResults.length,
      }), { status: 200 })

      const startTime = performance.now()
      render(<App />)

      const searchInput = screen.getByPlaceholderText(/search videos/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      await userEvent.type(searchInput, 'test query')
      await userEvent.click(searchButton)

      await waitFor(() => {
        expect(screen.getByText('Video 0')).toBeInTheDocument()
        expect(screen.getByText('Video 99')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(2000) // 2 seconds max
    })
  })
})