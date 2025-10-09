import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Share2, Clock, Video, BookOpen, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

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
}

interface NotesManagerProps {
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

export function NotesManager({ 
  notes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  onShareNote,
  currentVideo 
}: NotesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [newNoteTimestamp, setNewNoteTimestamp] = useState('');

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.channelTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

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
      tags
    });

    setNewNoteContent('');
    setNewNoteTags('');
    setNewNoteTimestamp('');
    setIsAddDialogOpen(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !editingNote.content.trim()) return;

    onUpdateNote(editingNote.id, {
      content: editingNote.content,
      tags: editingNote.tags
    });

    setEditingNote(null);
  };

  const handleShareVideo = () => {
    if (currentVideo) {
      const videoUrl = `https://www.youtube.com/watch?v=${currentVideo.id}`;
      navigator.clipboard.writeText(videoUrl);
      alert('تم نسخ رابط الفيديو إلى الحافظة!');
    }
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
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
            </div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {note.videoTitle}
            </h3>
            {note.timestamp && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}
              </Badge>
            )}
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
          <div className="flex flex-wrap gap-1">
            {note.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          الملاحظات ({notes.length})
        </h2>
        <div className="flex gap-2">
          {currentVideo && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareVideo}
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
                <DialogContent className="max-w-4xl">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          الطابع الزمني (ثواني)
                        </label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newNoteTimestamp}
                          onChange={(e) => setNewNoteTimestamp(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          الوسوم (مفصولة بفواصل)
                        </label>
                        <Input
                          placeholder="مهم, ملخص, مفاهيم"
                          value={newNoteTags}
                          onChange={(e) => setNewNoteTags(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        المحتوى
                      </label>
                      <RichTextEditor
                        content={newNoteContent}
                        onChange={setNewNoteContent}
                        placeholder="اكتب ملاحظاتك هنا..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddNote} disabled={!newNoteContent.trim()}>
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

      {/* Search and Filter */}
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
        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">جميع الوسوم</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            {notes.length === 0 ? "لا توجد ملاحظات بعد" : "لا توجد ملاحظات تطابق البحث"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-4xl">
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  الوسوم (مفصولة بفواصل)
                </label>
                <Input
                  placeholder="مهم, ملخص, مفاهيم"
                  value={editingNote.tags.join(', ')}
                  onChange={(e) => setEditingNote({
                    ...editingNote,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  المحتوى
                </label>
                <RichTextEditor
                  content={editingNote.content}
                  onChange={(content) => setEditingNote({ ...editingNote, content })}
                  placeholder="اكتب ملاحظاتك هنا..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateNote} disabled={!editingNote.content.trim()}>
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
