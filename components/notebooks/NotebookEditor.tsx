'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { Notebook, CreateNotebookRequest, UpdateNotebookRequest } from '@/types/notes'

interface NotebookEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateNotebookRequest | { id: string; data: UpdateNotebookRequest }) => Promise<void>
  notebook?: Notebook
  mode: 'create' | 'edit'
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6b7280', // gray
  '#84cc16', // lime
]

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'study', label: 'Study' },
  { value: 'research', label: 'Research' },
  { value: 'projects', label: 'Projects' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'meeting', label: 'Meeting Notes' },
  { value: 'travel', label: 'Travel' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' }
]

export function NotebookEditor({
  isOpen,
  onClose,
  onSave,
  notebook,
  mode
}: NotebookEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [category, setCategory] = useState('general')
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && notebook) {
      setTitle(notebook.title)
      setDescription(notebook.description || '')
      setColor(notebook.color)
      setIsPublic(notebook.isPublic)
      setTags(notebook.tags)
      setCategory(notebook.category || 'general')
      setThumbnail(notebook.thumbnail || null)
    } else {
      // Reset form for create mode
      setTitle('')
      setDescription('')
      setColor('#3b82f6')
      setIsPublic(false)
      setTags('')
      setTagInput('')
      setCategory('general')
      setThumbnail(null)
      setThumbnailFile(null)
    }
  }, [mode, notebook, isOpen])

  const handleSave = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        color,
        isPublic,
        tags: tags.trim(),
        category
      }

      if (mode === 'edit' && notebook) {
        await onSave({ id: notebook.id, data })
        
        // Upload thumbnail if changed
        if (thumbnailFile && mode === 'edit') {
          await uploadThumbnail(notebook.id)
        }
      } else {
        const result = await onSave(data)
        
        // Upload thumbnail for new notebook
        if (thumbnailFile && result && 'id' in result) {
          await uploadThumbnail((result as any).id)
        }
      }
      
      onClose()
    } catch (error) {
      // Failed to save notebook
    } finally {
      setLoading(false)
    }
  }

  const uploadThumbnail = async (notebookId: string) => {
    if (!thumbnailFile) return

    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append('file', thumbnailFile)

      const response = await fetch(`/api/notebooks/${notebookId}/thumbnail`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail')
      }

      const result = await response.json()
      setThumbnail(result.thumbnailPath)
      setThumbnailFile(null)
    } catch (error) {
      // Error uploading thumbnail
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnail(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setThumbnail(null)
    setThumbnailFile(null)
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = tags ? `${tags},${trimmedTag}` : trimmedTag
      setTags(newTags)
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    const newTags = currentTags.filter(tag => tag !== tagToRemove).join(',')
    setTags(newTags)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const currentTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Notebook' : 'Edit Notebook'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new notebook to organize your notes' 
              : 'Edit the notebook details and settings'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notebook title..."
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter notebook description (optional)..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === presetColor ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail Image</Label>
            <div className="space-y-3">
              {thumbnail ? (
                <div className="relative group">
                  <img
                    src={thumbnail}
                    alt="Notebook thumbnail"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={removeThumbnail}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <div className="text-center space-y-2">
                    <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Upload a thumbnail image for your notebook
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF up to 5MB
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                        id="thumbnail-upload"
                        disabled={uploadingThumbnail}
                      />
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        disabled={uploadingThumbnail}
                      >
                        <label htmlFor="thumbnail-upload" className="cursor-pointer flex items-center gap-2">
                          {uploadingThumbnail ? (
                            <>
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Choose Image
                            </>
                          )}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button onClick={handleAddTag} size="sm" variant="outline">
                Add
              </Button>
            </div>
            {currentTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Notebook</Label>
              <p className="text-sm text-muted-foreground">
                Others can view this notebook if it's public
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div 
              className="p-3 rounded-lg border"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              {thumbnail && (
                <img
                  src={thumbnail}
                  alt="Notebook thumbnail"
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium">{title || 'Untitled Notebook'}</span>
                <Badge variant={isPublic ? 'default' : 'secondary'} className="text-xs">
                  {isPublic ? 'Public' : 'Private'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {CATEGORIES.find(c => c.value === category)?.label || 'General'}
                </Badge>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground mb-2">{description}</p>
              )}
              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentTags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}