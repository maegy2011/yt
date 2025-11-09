'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Clock, 
  Scissors,
  MoreVertical,
  Eye,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react'
import { VideoNote } from '@/types/notes'
import { formatTime, getNoteDuration, isNoteClip } from '@/utils/notes'
import { useBackgroundPlayer } from '@/contexts/background-player-context'

interface NoteCardProps {
  note: VideoNote
  onEdit: (note: VideoNote) => void
  onDelete: (noteId: string) => void
  onPlay?: (note: VideoNote) => void
  className?: string
}

export function NoteCard({ note, onEdit, onDelete, onPlay, className = '' }: NoteCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const {
    backgroundVideo,
    isPlaying: isBackgroundPlaying,
    playBackgroundVideo,
    pauseBackgroundVideo,
  } = useBackgroundPlayer()

  const isClip = isNoteClip(note)
  const duration = getNoteDuration(note)
  const isCurrentVideo = backgroundVideo?.videoId === note.videoId

  const handlePlay = () => {
    if (onPlay) {
      onPlay(note)
    }
  }

  const handleEdit = () => {
    onEdit(note)
    setIsMenuOpen(false)
  }

  const handleDelete = () => {
    onDelete(note.id)
    setIsMenuOpen(false)
  }

  const getCardClasses = () => {
    const baseClasses = 'group relative transition-all duration-200 hover:shadow-md'
    const mobileClasses = 'w-full max-w-sm mx-auto'
    const desktopClasses = 'w-full'
    
    return `${baseClasses} ${mobileClasses} sm:${desktopClasses} ${className}`
  }

  return (
    <Card 
      className={getCardClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {note.thumbnail ? (
          <img 
            src={note.thumbnail} 
            alt={note.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">No thumbnail</p>
            </div>
          </div>
        )}
        
        {/* Duration Badge */}
        {isClip && duration > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-2 right-2 bg-black/80 text-white text-xs"
          >
            {formatTime(duration)}
          </Badge>
        )}
        
        {/* Clip Badge */}
        {isClip && (
          <Badge 
            variant="default" 
            className="absolute top-2 left-2 bg-primary hover:bg-primary/90"
          >
            <Scissors className="w-3 h-3 mr-1" />
            Clip
          </Badge>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={handlePlay}
          >
            {isCurrentVideo && isBackgroundPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Card Content */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1">
              {note.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {note.channelName}
            </p>
          </div>
          
          {/* Menu Button */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-background border rounded-md shadow-lg min-w-[120px] py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-3"
                  onClick={handleEdit}
                >
                  <Edit className="w-3 h-3 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-8 px-3 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Note Content */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
            {note.note}
          </p>
          
          {/* Time Information */}
          {isClip && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {formatTime(note.startTime || 0)} - {formatTime(note.endTime || 0)}
              </span>
            </div>
          )}
          
          {/* Created Date */}
          <p className="text-xs text-muted-foreground">
            {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}