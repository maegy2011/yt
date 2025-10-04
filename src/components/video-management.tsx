'use client';

/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface VideoData {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnails?: any;
  duration?: string;
  channelId?: string;
  channel?: {
    id: string;
    channelId: string;
    channelTitle: string;
  };
  isActive: boolean;
  manualTags?: string[];
  addedAt: string;
  lastFetched?: string;
}

interface ChannelData {
  id: string;
  channelId: string;
  channelTitle: string;
}

interface VideoManagementProps {
  onVideoUpdate?: () => void;
}

export default function VideoManagement({ onVideoUpdate }: VideoManagementProps) {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    videoId: '',
    title: '',
    description: '',
    channelId: '',
    manualTags: '',
    isActive: true,
  });

  const videosPerPage = 10;

  useEffect(() => {
    fetchVideos();
    fetchChannels();
  }, [currentPage, searchTerm, selectedChannel, statusFilter]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: videosPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedChannel !== 'all') params.append('channelId', selectedChannel);
      if (statusFilter !== 'all') params.append('isActive', statusFilter);

      const response = await fetch(`/api/videos/list?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels/list?limit=100');
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const handleAddVideo = async () => {
    try {
      const response = await fetch('/api/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          manualTags: formData.manualTags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        resetForm();
        fetchVideos();
        if (onVideoUpdate) onVideoUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add video');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Error adding video');
    }
  };

  const handleUpdateVideo = async () => {
    if (!selectedVideo) return;

    try {
      const response = await fetch('/api/videos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.videoId,
          ...formData,
          manualTags: formData.manualTags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        resetForm();
        fetchVideos();
        if (onVideoUpdate) onVideoUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Error updating video');
    }
  };

  const handleToggleStatus = async (video: VideoData) => {
    try {
      const response = await fetch('/api/videos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.videoId,
          isActive: !video.isActive,
        }),
      });

      if (response.ok) {
        fetchVideos();
        if (onVideoUpdate) onVideoUpdate();
      }
    } catch (error) {
      console.error('Error toggling video status:', error);
    }
  };

  const handleFetchVideoData = async () => {
    if (!formData.videoId) {
      setFetchMessage('Please enter a video ID');
      return;
    }

    setFetchLoading(true);
    setFetchMessage('');

    try {
      const response = await fetch('/api/youtube/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: formData.videoId }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          title: data.video.title || '',
          description: data.video.description || '',
          channelId: data.video.channelId || '',
        }));
        setFetchMessage('Video data fetched successfully!');
      } else {
        setFetchMessage(data.error || 'Failed to fetch video data');
      }
    } catch (error) {
      console.error('Error fetching video data:', error);
      setFetchMessage('Error fetching video data');
    } finally {
      setFetchLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      videoId: '',
      title: '',
      description: '',
      channelId: '',
      manualTags: '',
      isActive: true,
    });
    setSelectedVideo(null);
    setFetchMessage('');
  };

  const openEditDialog = (video: VideoData) => {
    setSelectedVideo(video);
    setFormData({
      videoId: video.videoId,
      title: video.title || '',
      description: video.description || '',
      channelId: video.channelId || '',
      manualTags: Array.isArray(video.manualTags) ? video.manualTags.join(', ') : '',
      isActive: video.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const VideoForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="videoId">معرف الفيديو (Video ID)</Label>
        <div className="flex gap-2">
          <Input
            id="videoId"
            value={formData.videoId}
            onChange={(e) => setFormData(prev => ({ ...prev, videoId: e.target.value }))}
            placeholder="dQw4w9WgXcQ"
            disabled={isEdit}
          />
          {!isEdit && (
            <Button 
              type="button" 
              onClick={handleFetchVideoData}
              disabled={fetchLoading || !formData.videoId}
              size="sm"
            >
              {fetchLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {fetchMessage && (
        <Alert className={fetchMessage.includes('success') ? 'border-green-200' : 'border-red-200'}>
          <AlertDescription>{fetchMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">عنوان الفيديو</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="عنوان الفيديو"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">وصف الفيديو</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="وصف الفيديو"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel">القناة</Label>
        <Select value={formData.channelId} onValueChange={(value) => setFormData(prev => ({ ...prev, channelId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر القناة" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.channelId} value={channel.channelId}>
                {channel.channelTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">التصنيفات (مفصولة بفواصل)</Label>
        <Input
          id="tags"
          value={formData.manualTags}
          onChange={(e) => setFormData(prev => ({ ...prev, manualTags: e.target.value }))}
          placeholder="إسلامي, تعليمي, دعوة"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">نشط</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            isEdit ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false);
            resetForm();
          }}
        >
          إلغاء
        </Button>
        <Button onClick={isEdit ? handleUpdateVideo : handleAddVideo}>
          {isEdit ? 'تحديث' : 'إضافة'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة الفيديوهات</h2>
          <p className="text-muted-foreground">إدارة الفيديوهات المسموح بها في النظام</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة فيديو
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة فيديو جديد</DialogTitle>
            </DialogHeader>
            <VideoForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="بحث عن فيديو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="القناة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع القنوات</SelectItem>
                {channels.map((channel) => (
                  <SelectItem key={channel.channelId} value={channel.channelId}>
                    {channel.channelTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="true">نشط</SelectItem>
                <SelectItem value="false">معطل</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchVideos}>
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفيديو</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>القناة</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin ml-2" />
                        جاري التحميل...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : videos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد فيديوهات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  videos.map((video) => (
                    <TableRow key={video.videoId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {video.thumbnails?.default?.url && (
                            <img
                              src={video.thumbnails.default.url}
                              alt={video.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          )}
                          <div className="font-mono text-sm text-muted-foreground">
                            {video.videoId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{video.title}</div>
                          {video.manualTags && Array.isArray(video.manualTags) && video.manualTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {video.manualTags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {video.manualTags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{video.manualTags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {video.channel?.channelTitle || 'غير محدد'}
                      </TableCell>
                      <TableCell>
                        {video.duration ? formatDuration(video.duration) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={video.isActive}
                            onCheckedChange={() => handleToggleStatus(video)}
                          />
                          <Badge variant={video.isActive ? "default" : "secondary"}>
                            {video.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(video.addedAt), { 
                            addSuffix: true, 
                            locale: arSA 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(video)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(video)}
                          >
                            {video.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            السابق
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تحديث الفيديو</DialogTitle>
          </DialogHeader>
          <VideoForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}