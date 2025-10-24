'use client';

import { useState, useEffect } from 'react';
import { Search, Home, Heart, FileText, Play, X, Menu, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatViewCount, formatDuration, formatPublishDate } from '@/lib/youtube';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  channelName: string;
  channelId: string;
}

interface FavoriteChannel {
  id: string;
  channelId: string;
  channelName: string;
  thumbnail: string;
  subscriberCount: string;
}

interface FavoriteVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  channelName: string;
  channelId: string;
}

interface VideoNote {
  id: string;
  videoId: string;
  title: string;
  content: string;
  timestamp: string;
  fontSize: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('الحويني');
  const [videos, setVideos] = useState<Video[]>([]);
  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<VideoNote | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', timestamp: '', fontSize: 16 });

  // Load initial data
  useEffect(() => {
    searchVideos();
    loadFavoriteChannels();
    loadFavoriteVideos();
    loadNotes();
  }, []);

  const searchVideos = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}&page=${page}`);
      const data = await response.json();
      
      if (page === 1) {
        setVideos(data.videos);
      } else {
        setVideos(prev => [...prev, ...data.videos]);
      }
      
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteChannels = async () => {
    try {
      const response = await fetch('/api/favorites/channels');
      const data = await response.json();
      setFavoriteChannels(data);
    } catch (error) {
      console.error('Load favorite channels error:', error);
    }
  };

  const loadFavoriteVideos = async () => {
    try {
      const response = await fetch('/api/favorites/videos');
      const data = await response.json();
      setFavoriteVideos(data);
    } catch (error) {
      console.error('Load favorite videos error:', error);
    }
  };

  const loadNotes = async (videoId?: string) => {
    try {
      const url = videoId ? `/api/notes?videoId=${videoId}` : '/api/notes';
      const response = await fetch(url);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Load notes error:', error);
    }
  };

  const addToFavoriteChannels = async (channel: FavoriteChannel) => {
    try {
      await fetch('/api/favorites/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channel),
      });
      loadFavoriteChannels();
    } catch (error) {
      console.error('Add favorite channel error:', error);
    }
  };

  const removeFromFavoriteChannels = async (id: string) => {
    try {
      await fetch(`/api/favorites/channels/${id}`, { method: 'DELETE' });
      loadFavoriteChannels();
    } catch (error) {
      console.error('Remove favorite channel error:', error);
    }
  };

  const addToFavoriteVideos = async (video: Video) => {
    try {
      await fetch('/api/favorites/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      loadFavoriteVideos();
    } catch (error) {
      console.error('Add favorite video error:', error);
    }
  };

  const removeFromFavoriteVideos = async (id: string) => {
    try {
      await fetch(`/api/favorites/videos/${id}`, { method: 'DELETE' });
      loadFavoriteVideos();
    } catch (error) {
      console.error('Remove favorite video error:', error);
    }
  };

  const saveNote = async () => {
    if (!selectedVideo) return;
    
    try {
      if (editingNote) {
        await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newNote),
        });
      } else {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newNote, videoId: selectedVideo.id }),
        });
      }
      
      setNewNote({ title: '', content: '', timestamp: '', fontSize: 16 });
      setEditingNote(null);
      setNoteDialogOpen(false);
      loadNotes(selectedVideo.id);
    } catch (error) {
      console.error('Save note error:', error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      loadNotes(selectedVideo?.id);
    } catch (error) {
      console.error('Delete note error:', error);
    }
  };

  const editNote = (note: VideoNote) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      timestamp: note.timestamp || '',
      fontSize: note.fontSize,
    });
    setNoteDialogOpen(true);
  };

  const isVideoFavorited = (videoId: string) => {
    return favoriteVideos.some(v => v.videoId === videoId);
  };

  const isChannelFavorited = (channelId: string) => {
    return favoriteChannels.some(c => c.channelId === channelId);
  };

  const VideoCard = ({ video, showFavorite = true }: { video: Video; showFavorite?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedVideo(video)}>
      <div className="relative">
        <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
          {formatDuration(video.duration)}
        </div>
        {showFavorite && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              if (isVideoFavorited(video.id)) {
                const fav = favoriteVideos.find(v => v.videoId === video.id);
                if (fav) removeFromFavoriteVideos(fav.id);
              } else {
                addToFavoriteVideos(video);
              }
            }}
          >
            <Heart className={`h-4 w-4 ${isVideoFavorited(video.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h3>
        <p className="text-xs text-gray-600 mb-1">{video.channelName}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatViewCount(video.viewCount)}</span>
          <span>•</span>
          <span>{formatPublishDate(video.publishedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                  className="pl-10 pr-4"
                />
              </div>
              <Button onClick={() => searchVideos()} disabled={loading}>
                {loading ? '...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-b">
          <nav className="flex flex-col p-4 space-y-2">
            {['search', 'home', 'favorites', 'channels', 'notes'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveTab(tab);
                  setShowMobileMenu(false);
                }}
                className="justify-start"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="search" className="hidden md:flex">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="home" className="hidden md:flex">
              <Home className="h-4 w-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="favorites" className="hidden md:flex">
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="channels" className="hidden md:flex">
              <Users className="h-4 w-4 mr-2" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="notes" className="hidden md:flex">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  onClick={() => searchVideos(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-4">Page {currentPage}</span>
                <Button
                  variant="outline"
                  onClick={() => searchVideos(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Home Tab */}
          <TabsContent value="home">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Favorite Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {favoriteVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">From Favorite Channels</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos
                    .filter(video => isChannelFavorited(video.channelId))
                    .map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favoriteVideos.map((video) => (
                <div key={video.id} className="relative">
                  <VideoCard video={video} />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 left-2"
                    onClick={() => removeFromFavoriteVideos(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteChannels.map((channel) => (
                <Card key={channel.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <img src={channel.thumbnail} alt={channel.channelName} className="w-16 h-16 rounded-full" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{channel.channelName}</h3>
                      <p className="text-sm text-gray-600">{channel.subscriberCount}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromFavoriteChannels(channel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{note.title}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editNote(note)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteNote(note.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2" style={{ fontSize: `${note.fontSize}px` }}>
                    {note.content}
                  </p>
                  {note.timestamp && (
                    <p className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {note.timestamp}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedVideo && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedVideo.title}</DialogTitle>
              </DialogHeader>
              
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{formatViewCount(selectedVideo.viewCount)}</span>
                  <span>{formatPublishDate(selectedVideo.publishedAt)}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!isChannelFavorited(selectedVideo.channelId)) {
                        addToFavoriteChannels({
                          id: '',
                          channelId: selectedVideo.channelId,
                          channelName: selectedVideo.channelName,
                          thumbnail: '',
                          subscriberCount: '',
                        });
                      }
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isChannelFavorited(selectedVideo.channelId) ? 'Channel Favorited' : 'Favorite Channel'}
                  </Button>
                  
                  <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="note-title">Title</Label>
                          <Input
                            id="note-title"
                            value={newNote.title}
                            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="note-content">Content</Label>
                          <Textarea
                            id="note-content"
                            value={newNote.content}
                            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label htmlFor="note-timestamp">Timestamp (optional)</Label>
                          <Input
                            id="note-timestamp"
                            value={newNote.timestamp}
                            onChange={(e) => setNewNote({ ...newNote, timestamp: e.target.value })}
                            placeholder="e.g., 5:30"
                          />
                        </div>
                        <div>
                          <Label htmlFor="note-font-size">Font Size</Label>
                          <Select
                            value={newNote.fontSize.toString()}
                            onValueChange={(value) => setNewNote({ ...newNote, fontSize: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">Small</SelectItem>
                              <SelectItem value="16">Medium</SelectItem>
                              <SelectItem value="20">Large</SelectItem>
                              <SelectItem value="24">Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={saveNote} className="w-full">
                          {editingNote ? 'Update Note' : 'Save Note'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Notes</h3>
                {notes.filter(note => note.videoId === selectedVideo.id).map((note) => (
                  <Card key={note.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{note.title}</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editNote(note)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteNote(note.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1" style={{ fontSize: `${note.fontSize}px` }}>
                      {note.content}
                    </p>
                    {note.timestamp && (
                      <p className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {note.timestamp}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}