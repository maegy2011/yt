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
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
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
      {/* Batch Selection Header */}
      {isSelectionMode && selectedNotes.size > 0 && (
        <Card className="mb-4 border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedNotes.size} note{selectedNotes.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                {onAddToNotebook && (
                  <Button
                    size="sm"
                    onClick={handleAddSelectedToNotebook}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Add to Notebook
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedNotes(new Set())}
                >
                  Clear Selection
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
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Video Notes
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">
                    {stats.total} total
                  </Badge>
                  <Badge variant="outline">
                    {stats.clips} clips
                  </Badge>
                  <Badge variant="outline">
                    {stats.regularNotes} notes
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={onCreateNew} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
              
              {onAddToNotebook && (
                <Button
                  variant="outline"
                  onClick={toggleSelectionMode}
                  className={`w-full sm:w-auto ${isSelectionMode ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {isSelectionMode ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Exit Selection
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select Notes
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
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes by title, content, or channel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
                  className="text-xs flex-1 justify-start"
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={filterType === 'clips' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('clips')}
                  className="text-xs flex-1 justify-start"
                >
                  <Scissors className="w-3 h-3 mr-2" />
                  Clips ({stats.clips})
                </Button>
                <Button
                  variant={filterType === 'notes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('notes')}
                  className="text-xs flex-1 justify-start"
                >
                  <FileText className="w-3 h-3 mr-2" />
                  Notes ({stats.regularNotes})
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