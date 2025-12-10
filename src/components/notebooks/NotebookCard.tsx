'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Book, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus,
  MoreVertical,
  Tag,
  Calendar,
  FileText,
  Image as ImageIcon
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Notebook } from '@/types/notes'
import { formatDistanceToNow } from 'date-fns'

interface NotebookCardProps {
  notebook: Notebook
  onEdit?: (notebook: Notebook) => void
  onDelete?: (notebook: Notebook) => void
  onSelect?: (notebook: Notebook) => void
  onToggleVisibility?: (notebook: Notebook) => void
  onAddNote?: (notebook: Notebook) => void
  className?: string
}

export function NotebookCard({
  notebook,
  onEdit,
  onDelete,
  onSelect,
  onToggleVisibility,
  onAddNote,
  className = ''
}: NotebookCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(notebook)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(notebook)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(notebook)
    }
  }

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleVisibility) {
      onToggleVisibility(notebook)
    }
  }

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddNote) {
      onAddNote(notebook)
    }
  }

  const parseTags = (tagsString: string): string[] => {
    if (!tagsString || tagsString.trim() === '') return []
    return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
  }

  const getCategoryLabel = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'general': 'General',
      'work': 'Work',
      'personal': 'Personal',
      'study': 'Study',
      'research': 'Research',
      'projects': 'Projects',
      'ideas': 'Ideas',
      'meeting': 'Meeting Notes',
      'travel': 'Travel',
      'health': 'Health & Fitness',
      'finance': 'Finance',
      'other': 'Other'
    }
    return categoryMap[category] || category
  }

  const tags = parseTags(notebook.tags)

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isHovered ? 'shadow-lg' : ''} ${className}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderLeft: `4px solid ${notebook.color}`
      }}
    >
      {/* Thumbnail */}
      {notebook.thumbnail && (
        <div className="relative h-32 sm:h-40 overflow-hidden">
          <img
            src={notebook.thumbnail}
            alt={notebook.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-white font-semibold text-sm sm:text-base truncate drop-shadow-lg">
              {notebook.title}
            </h3>
          </div>
        </div>
      )}

      <CardHeader className={notebook.thumbnail ? 'pb-3 pt-2' : 'pb-3'}>
        {!notebook.thumbnail && (
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Book 
                className="h-5 w-5 flex-shrink-0" 
                style={{ color: notebook.color }}
              />
              <CardTitle className="text-base sm:text-lg truncate">{notebook.title}</CardTitle>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleVisibility}
                className="h-8 w-8 p-0 touch-manipulation-none"
              >
                {notebook.isPublic ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 touch-manipulation-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEdit} className="touch-manipulation-none">
                    <Edit className="h-4 w-4 mr-2" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddNote} className="touch-manipulation-none">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add Note</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive touch-manipulation-none"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        {notebook.description && !notebook.thumbnail && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {notebook.description}
          </p>
        )}

        {/* Category and Badges */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(notebook.category || 'general')}
          </Badge>
  
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">{formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })}</span>
            <span className="sm:hidden">{formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: false })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Book className="h-3 w-3" />
            {notebook.noteCount || 0} notes
          </div>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: notebook.color }}
          />
          <span className="text-xs text-muted-foreground">
            {notebook.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}