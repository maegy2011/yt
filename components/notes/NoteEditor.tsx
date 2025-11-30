'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Save, 
  X, 
  Clock, 
  Scissors,
  RotateCcw,
  Plus,
  Edit
} from 'lucide-react'
import { VideoNote, CreateNoteRequest, UpdateNoteRequest } from '@/types/notes'
import { formatTime, validateNoteTime } from '@/utils/notes'
import { useBackgroundPlayer } from '@/contexts/background-player-context'

interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateNoteRequest | { id: string; data: UpdateNoteRequest }) => Promise<void>
  note?: VideoNote
  videoData: {
    videoId: string
    title: string
    channelName: string
    thumbnail?: string
  }
  mode: 'create' | 'edit'
}

export function NoteEditor({ isOpen, onClose, onSave, note, videoData, mode }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [startTime, setStartTime] = useState([0])
  const [endTime, setEndTime] = useState([30])
  const [isClip, setIsClip] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  
  const {
    backgroundVideo,
    isPlaying: isBackgroundPlaying,
    playBackgroundVideo,
    pauseBackgroundVideo,
    seekTo,
  } = useBackgroundPlayer()

  useEffect(() => {
    if (note && mode === 'edit') {
      setTitle(note.title)
      setContent(note.note)
      setStartTime([note.startTime || 0])
      setEndTime([note.endTime || 30])
      setIsClip(note.isClip || false)
    } else {
      setTitle('')
      setContent('')
      setStartTime([0])
      setEndTime([30])
      setIsClip(false)
    }
  }, [note, mode])

  const handleSetStartTime = () => {
    if (backgroundVideo) {
      setStartTime([Math.floor(currentTime)])
      if (endTime[0] <= currentTime) {
        setEndTime([Math.floor(currentTime + 30)])
      }
    }
  }

  const handleSetEndTime = () => {
    if (backgroundVideo) {
      const newEndTime = Math.floor(currentTime)
      if (newEndTime > startTime[0]) {
        setEndTime([newEndTime])
      }
    }
  }

  const handlePlayClip = () => {
    if (backgroundVideo) {
      seekTo(startTime?.[0] || 0)
      playBackgroundVideo()
      setIsPlaying(true)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return
    }

    if (isClip && !validateNoteTime(startTime[0], endTime[0])) {
      return
    }

    setIsSaving(true)
    try {
      if (mode === 'create') {
        const data: CreateNoteRequest = {
          videoId: videoData.videoId,
          title: title.trim(),
          channelName: videoData.channelName,
          thumbnail: videoData.thumbnail,
          note: content.trim(),
          startTime: isClip ? startTime[0] : undefined,
          endTime: isClip ? endTime[0] : undefined,
          isClip
        }
        await onSave(data)
      } else {
        const data: UpdateNoteRequest = {
          note: content.trim(),
          title: title.trim()
        }
        await onSave({ id: note!.id, data })
      }
      onClose()
    } catch (error) {
      // Console statement removed
    } finally {
      setIsSaving(false)
    }
  }

  const getEditorClasses = () => {
    return 'w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={getEditorClasses()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <Plus className="w-5 h-5" />
                Create New Note
              </>
            ) : (
              <>
                <Edit className="w-5 h-5" />
                Edit Note
              </>
            )}
            {isClip && (
              <Badge variant="default" className="ml-2">
                <Scissors className="w-3 h-3 mr-1" />
                Clip
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new note for this video' 
              : 'Edit the content and details of your note'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Video Info */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                  {videoData.thumbnail ? (
                    <img 
                      src={videoData.thumbnail} 
                      alt={videoData.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm break-words">{videoData.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{videoData.channelName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note Type Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={isClip ? "default" : "outline"}
              size="sm"
              onClick={() => setIsClip(true)}
              className="text-xs"
            >
              <Scissors className="w-3 h-3 mr-1" />
              Video Clip
            </Button>
            <Button
              variant={!isClip ? "default" : "outline"}
              size="sm"
              onClick={() => setIsClip(false)}
              className="text-xs"
            >
              <Edit className="w-3 h-3 mr-1" />
              Text Note
            </Button>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full break-words"
            />
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Content *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note content..."
              className="w-full min-h-[100px] resize-none whitespace-pre-wrap break-words"
            />
          </div>

          {/* Clip Settings */}
          {isClip && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Clip Settings</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayClip}
                    className="text-xs"
                  >
                    {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                    Preview Clip
                  </Button>
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Start Time</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(startTime[0])}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSetStartTime}
                        className="h-6 px-2 text-xs"
                      >
                        Set Current
                      </Button>
                    </div>
                  </div>
                  <Slider
                    value={startTime}
                    onValueChange={setStartTime}
                    max={Math.max(endTime[0] - 1, duration)}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">End Time</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(endTime[0])}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSetEndTime}
                        className="h-6 px-2 text-xs"
                      >
                        Set Current
                      </Button>
                    </div>
                  </div>
                  <Slider
                    value={endTime}
                    onValueChange={setEndTime}
                    min={startTime[0] + 1}
                    max={duration}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Duration Display */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Clip Duration:</span>
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTime(endTime[0] - startTime[0])}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isSaving || !title.trim() || !content.trim() || (isClip && !validateNoteTime(startTime[0], endTime[0]))}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}