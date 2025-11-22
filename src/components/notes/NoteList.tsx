'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus,
  FileText,
  Scissors,
  Clock,
  SortAsc,
  SortDesc,
  RefreshCw,
  CheckSquare,
  Square,
  BookOpen
} from 'lucide-react'
import { VideoNote } from '@/types/notes'
import { NoteCard } from './NoteCard'
import { getNotesStats, sortNotesByTime } from '@/utils/notes'

interface NoteListProps {
  notes: VideoNote[]
  loading: boolean
  onEdit: (note: VideoNote) => void
  onDelete: (noteId: string) => void
  onPlay?: (note: VideoNote) => void
  onCreateNew: () => void
  onRefresh?: () => void
  onAddToNotebook?: (selectedNotes: VideoNote[]) => void
  className?: string
}

export function NoteList({ 
  notes, 
  loading, 
  onEdit, 
  onDelete, 
  onPlay, 
  onCreateNew,
  onRefresh,
  onAddToNotebook,
  className = '' 
}: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'clips' | 'notes'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'time'>('date')
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const filteredNotes = useMemo(() => {
    let filtered = notes

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.note.toLowerCase().includes(query) ||
        note.channelName.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (filterType === 'clips') {
      filtered = filtered.filter(note => note.isClip)
    } else if (filterType === 'notes') {
      filtered = filtered.filter(note => !note.isClip)
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'time':
        filtered = sortNotesByTime(filtered)
        break
    }

    return filtered
  }, [notes, searchQuery, filterType, sortBy])

  const stats = useMemo(() => getNotesStats(notes), [notes])

  const handleSelectNote = (noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(noteId)) {
        newSet.delete(noteId)
      } else {
        newSet.add(noteId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedNotes.size === filteredNotes.length) {
      setSelectedNotes(new Set())
    } else {
      setSelectedNotes(new Set(filteredNotes.map(note => note.id)))
    }
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    if (isSelectionMode) {
      setSelectedNotes(new Set())
    }
  }

  const handleAddSelectedToNotebook = () => {
    const selected = filteredNotes.filter(note => selectedNotes.has(note.id))
    if (selected.length > 0 && onAddToNotebook) {
      onAddToNotebook(selected)
    }
  }

  const getContainerClasses = () => {
    const baseClasses = 'w-full'
    return `${baseClasses} ${className}`
  }

  const getGridClasses = () => {
    if (viewMode === 'grid') {
      return 'grid-mobile-1' // Single column on mobile, more on larger screens
    }
    return 'space-y-4'
  }

  if (loading) {
    return (
      <div className={getContainerClasses()}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={getContainerClasses()}>
      {/* Batch Selection Header - Mobile Optimized */}
      {isSelectionMode && selectedNotes.size > 0 && (
        <Card className="mb-4 border-primary bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium">
                {selectedNotes.size} note{selectedNotes.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                {onAddToNotebook && (
                  <Button
                    size="sm"
                    onClick={handleAddSelectedToNotebook}
                    className="flex items-center gap-2 h-11 min-h-[44px] touch-manipulation mobile-touch-feedback"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Add to Notebook</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedNotes(new Set())}
                  className="h-11 min-h-[44px] touch-manipulation mobile-touch-feedback"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FileText className="w-5 h-5" />
                  Video Notes
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.total} total
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {stats.clips} clips
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {stats.regularNotes} notes
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button onClick={onCreateNew} className="w-full h-11 min-h-[44px] touch-manipulation mobile-touch-feedback">
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
              
              <div className="flex gap-2">
                {onAddToNotebook && (
                  <Button
                    variant="outline"
                    onClick={toggleSelectionMode}
                    className={`flex-1 h-11 min-h-[44px] touch-manipulation mobile-touch-feedback ${
                      isSelectionMode ? 'bg-primary text-primary-foreground' : ''
                    }`}
                  >
                    {isSelectionMode ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Exit Selection</span>
                        <span className="sm:hidden">Exit</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Select Notes</span>
                        <span className="sm:hidden">Select</span>
                      </>
                    )}
                  </Button>
                )}
                
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loading}
                    className="h-11 min-h-[44px] min-w-[44px] touch-manipulation mobile-touch-feedback"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar - Mobile Optimized */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes by title, content, or channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 min-h-[44px] text-base"
              />
            </div>

            {/* Filter Controls - Mobile First */}
            <div className="space-y-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1 p-2 bg-muted rounded-lg">
                <Button
                  variant={filterType === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="text-xs flex-1 justify-start h-10 min-h-[40px] touch-manipulation mobile-touch-feedback"
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={filterType === 'clips' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('clips')}
                  className="text-xs flex-1 justify-start h-10 min-h-[40px] touch-manipulation mobile-touch-feedback"
                >
                  <Scissors className="w-3 h-3 mr-2" />
                  <span className="hidden sm:inline">Clips ({stats.clips})</span>
                  <span className="sm:hidden">Clips</span>
                </Button>
                <Button
                  variant={filterType === 'notes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('notes')}
                  className="text-xs flex-1 justify-start h-10 min-h-[40px] touch-manipulation mobile-touch-feedback"
                >
                  <FileText className="w-3 h-3 mr-2" />
                  <span className="hidden sm:inline">Notes ({stats.regularNotes})</span>
                  <span className="sm:hidden">Notes</span>
                </Button>
              </div>

              {/* Sort and View Options */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Selection Controls */}
                {isSelectionMode && (
                  <div className="flex items-center gap-1 p-2 bg-primary/10 rounded-lg flex-1">
                    <Button
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs flex-1 justify-start"
                    >
                      {selectedNotes.size === filteredNotes.length ? (
                        <>
                          <Square className="w-3 h-3 mr-2" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3 h-3 mr-2" />
                          Select All ({filteredNotes.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Sort Options */}
                <div className="flex items-center gap-1 p-2 bg-muted rounded-lg flex-1">
                  <Button
                    variant={sortBy === 'date' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('date')}
                    className="text-xs flex-1 justify-start"
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    Date
                  </Button>
                  <Button
                    variant={sortBy === 'title' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('title')}
                    className="text-xs flex-1 justify-start"
                  >
                    A-Z
                  </Button>
                  <Button
                    variant={sortBy === 'time' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('time')}
                    className="text-xs flex-1 justify-start"
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    Time
                  </Button>
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-1 p-2 bg-muted rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="text-xs flex-1 justify-start"
                  >
                    <Grid className="w-3 h-3 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="text-xs flex-1 justify-start"
                  >
                    <List className="w-3 h-3 mr-2" />
                    List
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid/List */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery 
                ? 'No notes match your search criteria.'
                : 'Start taking notes while watching videos to see them here.'
              }
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className={getGridClasses()}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={onEdit}
                onDelete={onDelete}
                onPlay={onPlay}
                isSelected={selectedNotes.has(note.id)}
                isSelectionMode={isSelectionMode}
                onSelect={handleSelectNote}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}