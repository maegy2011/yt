import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Clock, Bookmark, Plus, Edit, Trash2, Share2, Maximize2,
  RotateCcw, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoSyncNote {
  id: string;
  content: string;
  timestamp: number;
  duration?: number;
  tags: string[];
  type: 'note' | 'bookmark' | 'highlight';
  createdAt: string;
}

interface VideoSyncNotesProps {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  notes: VideoSyncNote[];
  onAddNote: (note: Omit<VideoSyncNote, 'id' | 'createdAt'>) => void;
  onUpdateNote: (id: string, note: Partial<VideoSyncNote>) => void;
  onDeleteNote: (id: string) => void;
  onShareNote: (note: VideoSyncNote) => void;
}

export function VideoSyncNotes({
  videoId,
  videoTitle,
  videoUrl,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onShareNote
}: VideoSyncNotesProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<VideoSyncNote | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [newNoteType, setNewNoteType] = useState<'note' | 'bookmark' | 'highlight'>('note');
  const [newNoteDuration, setNewNoteDuration] = useState(10);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (videoRef.current) {
      videoRef.current.volume = value[0];
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const addNoteAtCurrentTime = () => {
    setNewNoteContent('');
    setNewNoteTags('');
    setNewNoteType('note');
    setNewNoteDuration(10);
    setIsAddNoteOpen(true);
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const tags = newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag);

    onAddNote({
      content: newNoteContent,
      timestamp: currentTime,
      duration: newNoteType === 'highlight' ? newNoteDuration : undefined,
      tags,
      type: newNoteType
    });

    setNewNoteContent('');
    setNewNoteTags('');
    setIsAddNoteOpen(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !editingNote.content.trim()) return;

    onUpdateNote(editingNote.id, {
      content: editingNote.content,
      tags: editingNote.tags,
      duration: editingNote.duration
    });

    setEditingNote(null);
  };

  const getNotesAtCurrentTime = () => {
    return notes.filter(note => 
      currentTime >= note.timestamp && 
      currentTime <= (note.timestamp + (note.duration || 0))
    );
  };

  const getNotesNearCurrentTime = () => {
    return notes.filter(note => 
      Math.abs(note.timestamp - currentTime) <= 30 // Within 30 seconds
    ).sort((a, b) => Math.abs(a.timestamp - currentTime) - Math.abs(b.timestamp - currentTime));
  };

  const NoteMarker = ({ note }: { note: VideoSyncNote }) => {
    const position = (note.timestamp / duration) * 100;
    const isActive = currentTime >= note.timestamp && 
                     currentTime <= (note.timestamp + (note.duration || 0));
    const isNear = Math.abs(note.timestamp - currentTime) <= 5;

    return (
      <div
        className={`absolute top-0 w-1 h-full cursor-pointer transition-all duration-200 ${
          isActive 
            ? note.type === 'highlight' ? 'bg-yellow-400' : 'bg-blue-400'
            : isNear
            ? note.type === 'highlight' ? 'bg-yellow-200' : 'bg-blue-200'
            : note.type === 'highlight' ? 'bg-yellow-600' : 'bg-blue-600'
        }`}
        style={{ left: `${position}%` }}
        onClick={() => seekTo(note.timestamp)}
        title={`${formatTime(note.timestamp)} - ${note.content.substring(0, 50)}...`}
      >
        <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-xs whitespace-nowrap ${
          isActive ? 'font-bold' : ''
        }`}>
          {note.type === 'bookmark' ? '🔖' : note.type === 'highlight' ? '🟨' : '📝'}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="truncate flex-1">{videoTitle}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {notes.length} ملاحظات
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={addNoteAtCurrentTime}
              >
                <Plus className="w-4 h-4" />
                ملاحظة سريعة
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Video Element */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              className="w-full max-h-96 object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handlePause}
            >
              <source src={videoUrl} type="video/mp4" />
              متصفحك لا يدعم تشغيل الفيديو.
            </video>

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar with Markers */}
              <div className="relative mb-3">
                <div
                  className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = (clickX / rect.width) * duration;
                    seekTo(newTime);
                  }}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-200"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  {notes.map(note => (
                    <NoteMarker key={note.id} note={note} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => skip(-10)}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => skip(10)}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <div className="w-20">
                      <Slider
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <Select value={playbackRate.toString()} onValueChange={(value) => handlePlaybackRateChange(parseFloat(value))}>
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Time Notes */}
      {getNotesAtCurrentTime().length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ملاحظات في الوقت الحالي ({formatTime(currentTime)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getNotesAtCurrentTime().map(note => (
                <div key={note.id} className="p-2 bg-white rounded border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div 
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {note.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
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
                        onClick={() => onDeleteNote(note.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            ملاحظات قريبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getNotesNearCurrentTime().length === 0 ? (
            <p className="text-gray-500 text-sm">لا توجد ملاحظات قريبة من الوقت الحالي</p>
          ) : (
            <div className="space-y-2">
              {getNotesNearCurrentTime().map(note => {
                const timeDiff = Math.abs(note.timestamp - currentTime);
                return (
                  <div 
                    key={note.id} 
                    className="p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => seekTo(note.timestamp)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {note.type === 'bookmark' ? '🔖' : note.type === 'highlight' ? '🟨' : '📝'}
                            {formatTime(note.timestamp)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {timeDiff < 1 ? 'الآن' : `${Math.round(timeDiff)} ثانية`}
                          </span>
                        </div>
                        <div 
                          className="text-sm line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNote(note);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة ملاحظة في {formatTime(currentTime)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="noteType">نوع الملاحظة</Label>
              <Select value={newNoteType} onValueChange={(value: 'note' | 'bookmark' | 'highlight') => setNewNoteType(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">ملاحظة عادية</SelectItem>
                  <SelectItem value="bookmark">إشارة مرجعية</SelectItem>
                  <SelectItem value="highlight">تظليل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newNoteType === 'highlight' && (
              <div>
                <Label htmlFor="duration">المدة (ثواني)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  value={newNoteDuration}
                  onChange={(e) => setNewNoteDuration(parseInt(e.target.value) || 10)}
                  className="mt-1"
                />
              </div>
            )}

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
                حفظ الملاحظة
              </Button>
              <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل ملاحظة في {formatTime(editingNote?.timestamp || 0)}</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTags">الوسوم (مفصولة بفواصل)</Label>
                <Input
                  id="editTags"
                  placeholder="مهم, ملخص, مفاهيم"
                  value={editingNote.tags.join(', ')}
                  onChange={(e) => setEditingNote({
                    ...editingNote,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="mt-1"
                />
              </div>

              {editingNote.type === 'highlight' && (
                <div>
                  <Label htmlFor="editDuration">المدة (ثواني)</Label>
                  <Input
                    id="editDuration"
                    type="number"
                    min="1"
                    max="300"
                    value={editingNote.duration || 10}
                    onChange={(e) => setEditingNote({
                      ...editingNote,
                      duration: parseInt(e.target.value) || 10
                    })}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="editContent">المحتوى</Label>
                <RichTextEditor
                  content={editingNote.content}
                  onChange={(content) => setEditingNote({ ...editingNote, content })}
                  placeholder="اكتب ملاحظاتك هنا..."
                  className="mt-1"
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