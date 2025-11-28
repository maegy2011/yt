/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoCard } from '@/components/video/VideoCardEnhanced'

// Mock the background player context
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

// Mock the useAsyncOperation hook
jest.mock('@/hooks/useAsyncOperation', () => ({
  useAsyncOperation: () => ({
    loading: false,
    error: null,
    data: null,
    execute: jest.fn(),
    reset: jest.fn(),
    retry: jest.fn(),
    isIdle: true,
    isSuccess: false,
    isError: false,
  }),
}))

describe('VideoCard', () => {
  const mockVideo = {
    videoId: 'test-video-id',
    title: 'Test Video Title',
    channelName: 'Test Channel',
    thumbnail: 'https://example.com/thumb.jpg',
    duration: '10:30',
    viewCount: 1000000,
    publishedAt: '2023-01-01T00:00:00.000Z',
    description: 'Test video description',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render video information correctly', () => {
    render(<VideoCard video={mockVideo} />)

    expect(screen.getByText('Test Video Title')).toBeInTheDocument()
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
    expect(screen.getByAltText('Test Video Title')).toBeInTheDocument()
  })

  it('should display duration badge when provided', () => {
    render(<VideoCard video={mockVideo} />)

    expect(screen.getByText('10:30')).toBeInTheDocument()
  })

  it('should display view count when showStats is true', () => {
    render(<VideoCard video={mockVideo} showStats />)

    expect(screen.getByText(/1M views/)).toBeInTheDocument()
  })

  it('should handle play button click', async () => {
    const onPlay = jest.fn()
    const user = userEvent.setup()

    render(<VideoCard video={mockVideo} onPlay={onPlay} />)

    const playButton = screen.getByRole('button', { name: /play/i })
    await user.click(playButton)

    expect(onPlay).toHaveBeenCalledWith(mockVideo)
  })

  it('should handle favorite button click', async () => {
    const onFavorite = jest.fn()
    const user = userEvent.setup()

    render(<VideoCard video={mockVideo} onFavorite={onFavorite} />)

    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    await user.click(favoriteButton)

    expect(onFavorite).toHaveBeenCalledWith(mockVideo)
  })

  it('should show favorite badge when variant is favorite', () => {
    render(<VideoCard video={mockVideo} variant="favorite" />)

    expect(screen.getByText('Favorite')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<VideoCard video={mockVideo} loading />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should handle external link click', async () => {
    const onExternalLink = jest.fn()
    const user = userEvent.setup()
    window.open = jest.fn()

    render(<VideoCard video={mockVideo} onExternalLink={onExternalLink} />)

    const externalLinkButton = screen.getByRole('button', { name: /external link/i })
    await user.click(externalLinkButton)

    expect(onExternalLink).toHaveBeenCalledWith(mockVideo)
    expect(window.open).toHaveBeenCalledWith('https://youtube.com/watch?v=test-video-id', '_blank')
  })

  it('should handle selection mode', async () => {
    const onSelect = jest.fn()
    const user = userEvent.setup()

    render(
      <VideoCard 
        video={mockVideo} 
        isSelectable 
        onSelect={onSelect}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    expect(onSelect).toHaveBeenCalledWith('test-video-id', true)
  })

  it('should show selected state', () => {
    render(
      <VideoCard 
        video={mockVideo} 
        isSelected 
        isSelectable
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('should handle blacklist button click', async () => {
    const onAddToBlacklist = jest.fn()
    const user = userEvent.setup()

    render(
      <VideoCard 
        video={mockVideo} 
        onAddToBlacklist={onAddToBlacklist}
      />
    )

    const blacklistButton = screen.getByRole('button', { name: /blacklist/i })
    await user.click(blacklistButton)

    expect(onAddToBlacklist).toHaveBeenCalledWith(mockVideo)
  })

  it('should show blacklist badge when isBlacklisted is true', () => {
    render(<VideoCard video={mockVideo} isBlacklisted />)

    expect(screen.getByText('Blacklisted')).toBeInTheDocument()
  })

  it('should show whitelist badge when isWhitelisted is true', () => {
    render(<VideoCard video={mockVideo} isWhitelisted />)

    expect(screen.getByText('Whitelisted')).toBeInTheDocument()
  })

  it('should handle different sizes', () => {
    const { rerender } = render(<VideoCard video={mockVideo} size="sm" />)
    
    // Small size
    expect(screen.getByText('Test Video Title')).toHaveClass('text-sm')
    
    // Rerender with large size
    rerender(<VideoCard video={mockVideo} size="lg" />)
    expect(screen.getByText('Test Video Title')).toHaveClass('text-lg')
  })

  it('should handle different variants', () => {
    const { rerender } = render(<VideoCard video={mockVideo} variant="default" />)
    
    // Default variant
    expect(screen.getByRole('article')).not.toHaveClass(/ring-red/)
    
    // Rerender with favorite variant
    rerender(<VideoCard video={mockVideo} variant="favorite" />)
    expect(screen.getByRole('article')).toHaveClass('ring-red')
    
    // Rerender with watched variant
    rerender(<VideoCard video={mockVideo} variant="watched" />)
    expect(screen.getByRole('article')).toHaveClass('ring-blue')
  })

  it('should show progress bar when showProgress is true and progress is provided', () => {
    const videoWithProgress = { ...mockVideo, progress: 50 }
    render(<VideoCard video={videoWithProgress} showProgress />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveStyle('width', '50%')
  })

  it('should handle live badge', () => {
    const liveVideo = { ...mockVideo, isLive: true }
    render(<VideoCard video={liveVideo} />)

    expect(screen.getByText('LIVE')).toBeInTheDocument()
    expect(screen.getByText('LIVE')).toHaveClass('animate-pulse')
  })

  it('should handle quality badge', () => {
    const hdVideo = { ...mockVideo, quality: '1080p' }
    render(<VideoCard video={hdVideo} />)

    expect(screen.getByText('1080p')).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<VideoCard video={mockVideo} />)

    // Check main card has proper role
    const card = screen.getByRole('button')
    expect(card).toHaveAttribute('aria-label', 'Play video: Test Video Title')
    
    // Check image has alt text
    const image = screen.getByAltText('Test Video Title')
    expect(image).toBeInTheDocument()
    
    // Check semantic structure
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const onPlay = jest.fn()
    const user = userEvent.setup()

    render(<VideoCard video={mockVideo} onPlay={onPlay} />)

    const card = screen.getByRole('button')
    card.focus()
    
    // Test Enter key
    await user.keyboard('{Enter}')
    expect(onPlay).toHaveBeenCalledWith(mockVideo)
    
    // Test Space key
    onPlay.mockClear()
    await user.keyboard('{ }')
    expect(onPlay).toHaveBeenCalledWith(mockVideo)
  })

  it('should handle hover states', async () => {
    render(<VideoCard video={mockVideo} />)

    const card = screen.getByRole('button')
    
    // Initial state - no play overlay
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
    
    // Hover over card
    fireEvent.mouseEnter(card)
    
    // Play overlay should appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    })
    
    // Mouse leave
    fireEvent.mouseLeave(card)
    
    // Play overlay should disappear
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
    })
  })

  it('should handle image load states', async () => {
    render(<VideoCard video={mockVideo} />)

    // Initially should show skeleton
    expect(screen.getByTestId('image-skeleton')).toBeInTheDocument()
    
    // Simulate image load
    const image = screen.getByAltText('Test Video Title')
    fireEvent.load(image)
    
    // Skeleton should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('image-skeleton')).not.toBeInTheDocument()
    })
  })

  it('should handle image error', async () => {
    render(<VideoCard video={mockVideo} />)

    const image = screen.getByAltText('Test Video Title')
    
    // Simulate image error
    fireEvent.error(image)
    
    // Should show fallback image
    await waitFor(() => {
      expect(image).toHaveAttribute('src', expect.stringContaining('via.placeholder.com'))
    })
  })

  it('should handle missing thumbnail', () => {
    const videoWithoutThumbnail = { ...mockVideo, thumbnail: undefined }
    render(<VideoCard video={videoWithoutThumbnail} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining('img.youtube.com'))
  })

  it('should handle missing channel thumbnail', () => {
    render(<VideoCard video={mockVideo} showChannelInfo />)

    const channelImage = screen.getByRole('img', { name: /Test Channel/i })
    expect(channelImage).toHaveAttribute('src', expect.stringContaining('ui-avatars.com'))
  })

  it('should respect disabled state', () => {
    render(<VideoCard video={mockVideo} loading />)

    const card = screen.getByRole('button')
    expect(card).toBeDisabled()
    expect(card).toHaveClass('pointer-events-none')
  })

  it('should apply custom className', () => {
    render(<VideoCard video={mockVideo} className="custom-class" />)

    const card = screen.getByRole('article')
    expect(card).toHaveClass('custom-class')
  })
})