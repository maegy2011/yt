import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Plus, Edit, Trash2, Share2, Clock, Video, BookOpen, Tag, 
  Download, FileText, Image, Link, Calendar, Star, Archive, Grid, List,
  ChevronDown, ChevronUp, X, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Note {
  id: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  channelThumbnail: string;
  content: string;
  timestamp?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  isArchived?: boolean;
}

interface EnhancedNotesManagerProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onShareNote: (note: Note) => void;
  currentVideo?: {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
  };
}

const CATEGORIES = [
  'ملخص',
  'مفاهيم',
  'أسئلة',
  'إجابات',
  'مصادر',
  'أفكار',
  'مهام',
  'أخرى'
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const PRIORITY_LABELS = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي'
};

export function EnhancedNotesManager({ 
  notes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  onShareNote,
  currentVideo 
}: EnhancedNotesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);
  
  // New note form state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [newNoteTimestamp, setNewNoteTimestamp] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNoteCategory, setNewNoteCategory] = useState('ملخص');

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // Search filter
      const matchesSearch = !searchQuery || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.channelTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => note.tags.includes(tag));
      
      // Category filter
      const matchesCategory = !selectedCategory || note.category === selectedCategory;
      
      // Priority filter
      const matchesPriority = !selectedPriority || note.priority === selectedPriority;
      
      // Archive filter
      const matchesArchive = showArchived || !note.isArchived;
      
      return matchesSearch && matchesTags && matchesCategory && matchesPriority && matchesArchive;
    });

    // Sort notes
    return filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          compareValue = a.videoTitle.localeCompare(b.videoTitle);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = a.priority ? priorityOrder[a.priority] : 2;
          const bPriority = b.priority ? priorityOrder[b.priority] : 2;
          compareValue = aPriority - bPriority;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [notes, searchQuery, selectedTags, selectedCategory, selectedPriority, showArchived, sortBy, sortOrder]);

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));
  const allCategories = Array.from(new Set(notes.map(note => note.category).filter((category): category is string => Boolean(category))));

  const handleAddNote = () => {
    if (!currentVideo || !newNoteContent.trim()) return;

    const tags = newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const timestamp = newNoteTimestamp ? parseInt(newNoteTimestamp) : undefined;

    onAddNote({
      videoId: currentVideo.id,
      videoTitle: currentVideo.title,
      channelTitle: currentVideo.channelTitle,
      channelThumbnail: currentVideo.thumbnail,
      content: newNoteContent,
      timestamp,
      tags,
      priority: newNotePriority,
      category: newNoteCategory,
      isArchived: false
    });

    // Reset form
    setNewNoteContent('');
    setNewNoteTags('');
    setNewNoteTimestamp('');
    setNewNotePriority('medium');
    setNewNoteCategory('ملخص');
    setIsAddDialogOpen(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !editingNote.content.trim()) return;

    onUpdateNote(editingNote.id, {
      content: editingNote.content,
      tags: editingNote.tags,
      priority: editingNote.priority,
      category: editingNote.category,
      isArchived: editingNote.isArchived
    });

    setEditingNote(null);
  };

  const handleToggleArchive = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      onUpdateNote(noteId, { isArchived: !note.isArchived });
    }
  };

  const handleExportNotes = (format: 'json' | 'txt' | 'md') => {
    const notesToExport = filteredAndSortedNotes.filter(note => !note.isArchived);
    
    let content = '';
    let filename = '';
    
    switch (format) {
      case 'json':
        content = JSON.stringify(notesToExport, null, 2);
        filename = `notes-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'txt':
        content = notesToExport.map(note => {
          return `الملاحظة: ${note.videoTitle}\nالقناة: ${note.channelTitle}\n${note.timestamp ? `الوقت: ${Math.floor(note.timestamp / 60)}:${(note.timestamp % 60).toString().padStart(2, '0')}\n` : ''}التصنيف: ${note.category || 'غير مصنف'}\nالأولوية: ${note.priority ? PRIORITY_LABELS[note.priority] : 'متوسط'}\nالوسوم: ${note.tags.join(', ')}\n\nالمحتوى:\n${note.content.replace(/<[^>]*>/g, '')}\n\n${'='.repeat(50)}\n\n`;
        }).join('');
        filename = `notes-${new Date().toISOString().split('T')[0]}.txt`;
        break;
      case 'md':
        content = `# ملاحظاتي\n\nتاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}\n\n${notesToExport.map(note => {
          return `## ${note.videoTitle}\n\n**القناة:** ${note.channelTitle}  \n${note.timestamp ? `**الوقت:** ${Math.floor(note.timestamp / 60)}:${(note.timestamp % 60).toString().padStart(2, '0')}  \n` : ''}**التصنيف:** ${note.category || 'غير مصنف'}  \n**الأولوية:** ${note.priority ? PRIORITY_LABELS[note.priority] : 'متوسط'}  \n**الوسوم:** ${note.tags.map(tag => `\`${tag}\``).join(', ')}\n\n${note.content}\n\n---\n\n`;
        }).join('')}`;
        filename = `notes-${new Date().toISOString().split('T')[0]}.md`;
        break;
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <Card className={`hover:shadow-lg transition-all duration-200 ${note.isArchived ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={note.channelThumbnail} 
                alt={note.channelTitle}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm text-gray-600">{note.channelTitle}</span>
              {note.priority && (
                <Badge className={`text-xs ${PRIORITY_COLORS[note.priority]}`}>
                  <Star className="w-2 h-2 mr-1" />
                  {PRIORITY_LABELS[note.priority]}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {note.videoTitle}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {note.timestamp && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}
                </Badge>
              )}
              {note.category && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="w-2 h-2 mr-1" />
                  {note.category}
                </Badge>
              )}
              {note.isArchived && (
                <Badge variant="secondary" className="text-xs">
                  <Archive className="w-2 h-2 mr-1" />
                  مؤرشف
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingNote(note)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShareNote(note)}
            >
              <Share2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleArchive(note.id)}
            >
              <Archive className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteNote(note.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="text-sm text-gray-700 line-clamp-3 mb-3"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{new Date(note.createdAt).toLocaleDateString('ar-SA')}</span>
          {note.updatedAt !== note.createdAt && (
            <span>محدث: {new Date(note.updatedAt).toLocaleDateString('ar-SA')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const NoteListItem = ({ note }: { note: Note }) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <img 
            src={note.channelThumbnail} 
            alt={note.channelTitle}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                  {note.videoTitle}
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  {note.channelTitle}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {note.timestamp && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}
                    </Badge>
                  )}
                  {note.priority && (
                    <Badge className={`text-xs ${PRIORITY_COLORS[note.priority]}`}>
                      {PRIORITY_LABELS[note.priority]}
                    </Badge>
                  )}
                  {note.category && (
                    <Badge variant="outline" className="text-xs">
                      {note.category}
                    </Badge>
                  )}
                  {note.isArchived && (
                    <Badge variant="secondary" className="text-xs">
                      مؤرشف
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNote(note)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onShareNote(note)}
                >
                  <Share2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleArchive(note.id)}
                >
                  <Archive className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteNote(note.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div 
              className="text-sm text-gray-700 line-clamp-2 mb-2"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="w-2 h-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>{new Date(note.createdAt).toLocaleDateString('ar-SA')}</span>
              {note.updatedAt !== note.createdAt && (
                <span>محدث: {new Date(note.updatedAt).toLocaleDateString('ar-SA')}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            الملاحظات ({notes.filter(n => !n.isArchived).length})
          </h2>
          {notes.filter(n => n.isArchived).length > 0 && (
            <Badge variant="secondary">
              {notes.filter(n => n.isArchived).length} مؤرشف
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {currentVideo && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const videoUrl = `https://www.youtube.com/watch?v=${currentVideo.id}`;
                  navigator.clipboard.writeText(videoUrl);
                  alert('تم نسخ رابط الفيديو إلى الحافظة!');
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                مشاركة الفيديو
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة ملاحظة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة ملاحظة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {currentVideo && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img 
                          src={currentVideo.thumbnail} 
                          alt={currentVideo.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{currentVideo.title}</h4>
                          <p className="text-xs text-gray-600">{currentVideo.channelTitle}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="timestamp">الطابع الزمني (ثواني)</Label>
                        <Input
                          id="timestamp"
                          type="number"
                          placeholder="0"
                          value={newNoteTimestamp}
                          onChange={(e) => setNewNoteTimestamp(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">الأولوية</Label>
                        <Select value={newNotePriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewNotePriority(value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفض</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="high">عالي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category">التصنيف</Label>
                        <Select value={newNoteCategory} onValueChange={setNewNoteCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tags">الوسوم (مفصولة بفواصل)</Label>
                        <Input
                          id="tags"
                          placeholder="مهم, ملخص, مفاهيم"
                          value={newNoteTags}
                          onChange={(e) => setNewNoteTags(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="content">المحتوى</Label>
                      <RichTextEditor
                        content={newNoteContent}
                        onChange={setNewNoteContent}
                        placeholder="اكتب ملاحظاتك هنا..."
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                        <Save className="w-4 h-4 mr-2" />
                        حفظ الملاحظة
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="بحث في الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          
          {/* Export Options */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportNotes('json')}
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportNotes('txt')}
            >
              <Download className="w-4 h-4 mr-2" />
              TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportNotes('md')}
            >
              <Download className="w-4 h-4 mr-2" />
              MD
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg">
          {/* Category Filter */}
          {allCategories.length > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">التصنيف:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {allCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">الأولوية:</Label>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">الترتيب:</Label>
            <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'priority') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">التاريخ</SelectItem>
                <SelectItem value="title">العنوان</SelectItem>
                <SelectItem value="priority">الأولوية</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">العرض:</Label>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Show Archived */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="showArchived"
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(checked as boolean)}
            />
            <Label htmlFor="showArchived" className="text-sm">إظهار المؤرشف</Label>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedTags.length > 0 || selectedCategory || selectedPriority) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
                setSelectedCategory('');
                setSelectedPriority('');
              }}
            >
              <X className="w-4 h-4 mr-2" />
              مسح التصفية
            </Button>
          )}
        </div>
      </div>

      {/* Notes Display */}
      {filteredAndSortedNotes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {notes.length === 0 ? "لا توجد ملاحظات بعد" : "لا توجد ملاحظات تطابق البحث"}
          </p>
          <p className="text-gray-400 text-sm">
            {currentVideo ? "ابدأ بإضافة ملاحظة للفيديو الحالي" : "اختر فيديو لإضافة ملاحظات"}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : 
          "space-y-4"
        }>
          {filteredAndSortedNotes.map(note => 
            viewMode === 'grid' ? 
              <NoteCard key={note.id} note={note} /> : 
              <NoteListItem key={note.id} note={note} />
          )}
        </div>
      )}

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل ملاحظة</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={editingNote.channelThumbnail} 
                  alt={editingNote.channelTitle}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{editingNote.videoTitle}</h4>
                  <p className="text-sm text-gray-600">{editingNote.channelTitle}</p>
                </div>
                {editingNote.timestamp && (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {Math.floor(editingNote.timestamp / 60)}:{(editingNote.timestamp % 60).toString().padStart(2, '0')}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-priority">الأولوية</Label>
                  <Select 
                    value={editingNote.priority || 'medium'} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setEditingNote({ ...editingNote, priority: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-category">التصنيف</Label>
                  <Select 
                    value={editingNote.category || 'ملخص'} 
                    onValueChange={(value) => setEditingNote({ ...editingNote, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tags">الوسوم (مفصولة بفواصل)</Label>
                  <Input
                    id="edit-tags"
                    placeholder="مهم, ملخص, مفاهيم"
                    value={editingNote.tags.join(', ')}
                    onChange={(e) => setEditingNote({
                      ...editingNote,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-content">المحتوى</Label>
                <RichTextEditor
                  content={editingNote.content}
                  onChange={(content) => setEditingNote({ ...editingNote, content })}
                  placeholder="اكتب ملاحظاتك هنا..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-archived"
                  checked={editingNote.isArchived || false}
                  onCheckedChange={(checked) => 
                    setEditingNote({ ...editingNote, isArchived: checked as boolean })
                  }
                />
                <Label htmlFor="edit-archived">أرشف هذه الملاحظة</Label>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleUpdateNote} disabled={!editingNote.content.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ التغييرات
                </Button>
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}