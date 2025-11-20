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
  Calendar
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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Book 
              className="h-5 w-5 flex-shrink-0" 
              style={{ color: notebook.color }}
            />
            <CardTitle className="text-lg truncate">{notebook.title}</CardTitle>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleVisibility}
              className="h-8 w-8 p-0"
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
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddNote}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {notebook.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {notebook.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(notebook.createdAt), { addSuffix: true })}
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