'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Edit, Trash2, Play, Pause, ExternalLink, Clock, Filter, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface VideoNote {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  note: string
  fontSize: number
  startTime: number | null
  endTime: number | null
  isClip: boolean
  createdAt: string
  updatedAt: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<VideoNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<VideoNote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [selectedVideo, setSelectedVideo] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingNote, setEditingNote] = useState<VideoNote | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState({
    videoId: '',
    title: '',
    channelName: '',
    thumbnail: '',
    note: '',
    fontSize: 16,
    startTime: '',
    endTime: '',
    isClip: false
  })
  const [urlInput, setUrlInput] = useState('')
  const [loadingVideoInfo, setLoadingVideoInfo] = useState(false)

  // Get unique channels and videos for filters
  const channels = Array.from(new Set(notes.map(note => note.channelName)))
  const videos = Array.from(new Set(notes.map(note => ({ id: note.videoId, title: note.title }))))

  // Load notes
  const loadNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notes')
      if (!response.ok) throw new Error('Failed to load notes')
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort notes
  useEffect(() => {
    let filtered = notes

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.note.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Channel filter
    if (selectedChannel !== 'all') {
      filtered = filtered.filter(note => note.channelName === selectedChannel)
    }

    // Video filter
    if (selectedVideo !== 'all') {
      filtered = filtered.filter(note => note.videoId === selectedVideo)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'title') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      } else {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredNotes(filtered)
  }, [notes, searchQuery, selectedChannel, selectedVideo, sortBy, sortOrder])

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : url
  }

  // Fetch video details from YouTube API
  const fetchVideoDetails = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a YouTube URL')
      return
    }

    const videoId = extractVideoId(urlInput.trim())
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/
    
    if (!videoIdRegex.test(videoId)) {
      toast.error('Invalid YouTube URL or video ID')
      return
    }

    setLoadingVideoInfo(true)
    try {
      const response = await fetch(`/api/youtube/video/${videoId}`)
      if (!response.ok) throw new Error('Failed to fetch video details')
      
      const videoData = await response.json()
      
      setNewNote(prev => ({
        ...prev,
        videoId,
        title: videoData.title || '',
        channelName: videoData.channelName || '',
        thumbnail: videoData.thumbnail || ''
      }))
      
      setUrlInput('')
      toast.success('Video details loaded successfully')
    } catch (error) {
      toast.error('Failed to fetch video details. Please check the URL and try again.')
    } finally {
      setLoadingVideoInfo(false)
    }
  }

  // Create note
  const handleCreateNote = async () => {
    // Validate required fields
    if (!newNote.videoId || !newNote.title || !newNote.channelName || !newNote.note) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate video ID format (basic YouTube video ID validation)
    const videoIdRegex = /^[a-zA-Z0-9_-]{11}$/
    if (!videoIdRegex.test(newNote.videoId)) {
      toast.error('Invalid YouTube video ID format')
      return
    }

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNote,
          startTime: newNote.startTime ? parseInt(newNote.startTime) : null,
          endTime: newNote.endTime ? parseInt(newNote.endTime) : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create note')
      }
      
      toast.success('Note created successfully')
      setIsCreateDialogOpen(false)
      setNewNote({
        videoId: '',
        title: '',
        channelName: '',
        thumbnail: '',
        note: '',
        fontSize: 16,
        startTime: '',
        endTime: '',
        isClip: false
      })
      await loadNotes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create note')
    }
  }

  // Update note
  const handleUpdateNote = async () => {
    if (!editingNote) return

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: editingNote.note,
          fontSize: editingNote.fontSize
        })
      })

      if (!response.ok) throw new Error('Failed to update note')
      
      toast.success('Note updated successfully')
      setIsEditDialogOpen(false)
      setEditingNote(null)
      await loadNotes()
    } catch (error) {
      toast.error('Failed to update note')
    }
  }

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete note')
      
      toast.success('Note deleted successfully')
      await loadNotes()
    } catch (error) {
      toast.error('Failed to delete note')
    }
  }

  // Format time
  const formatTime = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Notes</h1>
            <p className="text-muted-foreground">Manage your video notes and clips</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} total
              {notes.filter(n => n.isClip).length > 0 && (
                <> • {notes.filter(n => n.isClip).length} clip{notes.filter(n => n.isClip).length > 1 ? 's' : ''}</>
              )}
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* URL Input Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube URL (optional)</label>
                    <div className="flex space-x-2">
                      <Input
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste YouTube URL to auto-fill details"
                        className="flex-1"
                      />
                      <Button
                        onClick={fetchVideoDetails}
                        disabled={loadingVideoInfo}
                        variant="outline"
                      >
                        {loadingVideoInfo ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : (
                          'Fetch'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Or manually enter the video details below
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Video ID *</label>
                      <Input
                        value={newNote.videoId}
                        onChange={(e) => setNewNote(prev => ({ ...prev, videoId: e.target.value }))}
                        placeholder="YouTube video ID (11 characters)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Title *</label>
                      <Input
                        value={newNote.title}
                        onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Video title"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Channel Name *</label>
                      <Input
                        value={newNote.channelName}
                        onChange={(e) => setNewNote(prev => ({ ...prev, channelName: e.target.value }))}
                        placeholder="Channel name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Thumbnail URL</label>
                      <Input
                        value={newNote.thumbnail}
                        onChange={(e) => setNewNote(prev => ({ ...prev, thumbnail: e.target.value }))}
                        placeholder="Thumbnail URL"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Note *</label>
                    <Textarea
                      value={newNote.note}
                      onChange={(e) => setNewNote(prev => ({ ...prev, note: e.target.value }))}
                      placeholder="Your note content"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Time (seconds)</label>
                      <Input
                        type="number"
                        value={newNote.startTime}
                        onChange={(e) => setNewNote(prev => ({ ...prev, startTime: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Time (seconds)</label>
                      <Input
                        type="number"
                        value={newNote.endTime}
                        onChange={(e) => setNewNote(prev => ({ ...prev, endTime: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Font Size</label>
                      <Input
                        type="number"
                        value={newNote.fontSize}
                        onChange={(e) => setNewNote(prev => ({ ...prev, fontSize: parseInt(e.target.value) || 16 }))}
                        min="8"
                        max="32"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isClip"
                      checked={newNote.isClip}
                      onChange={(e) => setNewNote(prev => ({ ...prev, isClip: e.target.checked }))}
                    />
                    <label htmlFor="isClip" className="text-sm font-medium">This is a clip</label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateNote}>
                      Create Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search notes, videos, or channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {channels.map(channel => (
                      <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by video" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Videos</SelectItem>
                    {videos.map(video => (
                      <SelectItem key={video.id} value={video.id}>{video.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created</SelectItem>
                    <SelectItem value="updatedAt">Updated</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>

                {(searchQuery || selectedChannel !== 'all' || selectedVideo !== 'all') && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedChannel('all')
                      setSelectedVideo('all')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {notes.length === 0 ? 'No notes yet. Create your first note!' : 'No notes match your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">{note.title}</h3>
                      <p className="text-xs text-muted-foreground">{note.channelName}</p>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingNote(note)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Thumbnail */}
                    {note.thumbnail && (
                      <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                        <img
                          src={note.thumbnail}
                          alt={note.title}
                          className="w-full h-full object-cover"
                        />
                        {note.isClip && (
                          <Badge className="absolute top-2 left-2" variant="secondary">
                            Clip
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Time Range */}
                    {(note.startTime !== null || note.endTime !== null) && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(note.startTime)} - {formatTime(note.endTime)}
                      </div>
                    )}

                    {/* Note Content */}
                    <div className="text-sm" style={{ fontSize: `${note.fontSize}px` }}>
                      <p className="line-clamp-3">{note.note}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://youtube.com/watch?v=${note.videoId}`, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Watch
                        </Button>
                        {(note.startTime !== null || note.endTime !== null) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const startTime = note.startTime || 0
                              const endTime = note.endTime || startTime + 30
                              window.open(
                                `https://youtube.com/watch?v=${note.videoId}&start=${startTime}&end=${endTime}`,
                                '_blank'
                              )
                            }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play Clip
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
            </DialogHeader>
            {editingNote && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Note Content</label>
                  <Textarea
                    value={editingNote.note}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, note: e.target.value } : null)}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Font Size</label>
                  <Input
                    type="number"
                    value={editingNote.fontSize}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, fontSize: parseInt(e.target.value) || 16 } : null)}
                    min="8"
                    max="32"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateNote}>
                    Update Note
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}