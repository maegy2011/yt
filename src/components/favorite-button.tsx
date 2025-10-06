'use client'

import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/use-favorites'

interface FavoriteButtonProps {
  video: {
    id: string
    title: string
    thumbnail: string
    channelName: string
    channelLogo?: string
    publishedAt: string
    duration?: string
    viewCount?: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function FavoriteButton({ video, size = 'md', className = '' }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const favorited = isFavorite(video.id)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent video selection when clicking favorite button
    toggleFavorite(video)
  }

  return (
    <Button
      variant={favorited ? 'default' : 'outline'}
      size="sm"
      className={`${sizeClasses[size]} ${className} transition-all duration-200 hover:scale-105`}
      onClick={handleClick}
      title={favorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
    >
      <Star
        className={`${iconSizeClasses[size]} ${
          favorited ? 'fill-current text-yellow-400' : ''
        }`}
      />
    </Button>
  )
}