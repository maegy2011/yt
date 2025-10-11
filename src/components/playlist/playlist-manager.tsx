'use client';

import { useState } from 'react';
import { 
  List, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Clock,
  Video as VideoIcon,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  duration: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  totalDuration: string;
  videos: Video[];
  createdAt: string;
  isPublic: boolean;
}

interface PlaylistManagerProps {
  onVideoSelect?: (videoId: string) => void;
}

export function PlaylistManager({ onVideoSelect }: PlaylistManagerProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: '1',
      name: 'فيديوهات تعليمية',
      description: 'مجموعة من الفيديوهات التعليمية في البرمجة',
      videoCount: 12,
      totalDuration: '2h 34m',
      videos: [
        {
          id: '1',
          title: 'مقدمة في البرمجة - الدرس الأول',
          thumbnailUrl: 'https://picsum.photos/seed/video1/320/180.jpg',
          channelTitle: 'قناة ماي يوتيوب التعليمية',
          duration: '10:15'
        },
        {
          id: '2',
          title: 'أساسيات JavaScript للمبتدئين',
          thumbnailUrl: 'https://picsum.photos/seed/video2/320/180.jpg',
          channelTitle: 'قناة ماي يوتيوب التعليمية',
          duration: '15:42'
        }
      ],
      createdAt: '2024-01-10',
      isPublic: true
    },
    {
      id: '2',
      name: 'موسيقى مفضلة',
      description: 'أغانيي ومقطوعاتي الموسيقية المفضلة',
      videoCount: 8,
      totalDuration: '45m 12s',
      videos: [
        {
          id: '3',
          title: 'أغنية عربية كلاسيكية',
          thumbnailUrl: 'https://picsum.photos/seed/music1/320/180.jpg',
          channelTitle: 'قناة الموسيقى العربية',
          duration: '4:32'
        }
      ],
      createdAt: '2024-01-08',
      isPublic: false
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال اسم قائمة التشغيل',
        variant: 'destructive'
      });
      return;
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      description: newPlaylistDescription,
      videoCount: 0,
      totalDuration: '0m',
      videos: [],
      createdAt: new Date().toISOString().split('T')[0],
      isPublic: false
    };

    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: 'تم الإنشاء',
      description: `تم إنشاء قائمة التشغيل "${newPlaylistName}" بنجاح`
    });
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter(p => p.id !== playlistId));
    toast({
      title: 'تم الحذف',
      description: 'تم حذف قائمة التشغيل بنجاح'
    });
  };

  const handlePlayPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && playlist.videos.length > 0) {
      setCurrentlyPlaying(playlistId);
      if (onVideoSelect) {
        onVideoSelect(playlist.videos[0].id);
      }
      toast({
        title: 'بدء التشغيل',
        description: `جاري تشغيل قائمة "${playlist.name}"`
      });
    } else {
      toast({
        title: 'قائمة فارغة',
        description: 'هذه القائمة لا تحتوي على أي فيديوهات',
        variant: 'destructive'
      });
    }
  };

  const handlePausePlaylist = () => {
    setCurrentlyPlaying(null);
    toast({
      title: 'تم الإيقاف',
      description: 'تم إيقاف التشغيل'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">قوائم التشغيل</h2>
          <p className="text-muted-foreground">إدارة قوائم التشغيل الخاصة بك</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>إنشاء قائمة تشغيل</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء قائمة تشغيل جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">اسم قائمة التشغيل</label>
                <Input
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="أدخل اسم قائمة التشغيل"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">الوصف (اختياري)</label>
                <Input
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="أدخل وصف قائمة التشغيل"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreatePlaylist} className="flex-1">
                  إنشاء
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <Card key={playlist.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <List className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {playlist.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {playlist.videoCount} فيديوهات • {playlist.totalDuration}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        const playlistEl = document.getElementById(`playlist-${playlist.id}`);
                        playlistEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>تعديل</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>حذف</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {playlist.description}
              </p>
              
              {/* Preview Videos */}
              <div className="grid grid-cols-2 gap-2">
                {playlist.videos.slice(0, 4).map((video, index) => (
                  <div key={index} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <VideoIcon className="h-4 w-4 text-primary/60" />
                    </div>
                    {index === 3 && playlist.videos.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          +{playlist.videos.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                {currentlyPlaying === playlist.id ? (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handlePausePlaylist}
                    className="flex-1"
                  >
                    <Pause className="h-4 w-4 ml-1" />
                    إيقاف
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handlePlayPlaylist(playlist.id)}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 ml-1" />
                    تشغيل
                  </Button>
                )}
                
                <Badge variant={playlist.isPublic ? 'default' : 'secondary'} className="text-xs">
                  {playlist.isPublic ? 'عام' : 'خاص'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>أنشئت في {playlist.createdAt}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {playlists.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground">
            <List className="w-full h-full" />
          </div>
          <h3 className="text-lg font-semibold mb-2">لا توجد قوائم تشغيل</h3>
          <p className="text-muted-foreground mb-4">
            ابدأ بإنشاء قائمة تشغيل جديدة لتنظيم فيديوهاتك المفضلة
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-1" />
            إنشاء قائمة تشغيل
          </Button>
        </div>
      )}
    </div>
  );
}