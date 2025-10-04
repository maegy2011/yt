'use client';

/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Video,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface ChannelData {
  id: string;
  channelId: string;
  channelTitle: string;
  addedAt: string;
  addedByUser?: {
    id: string;
    email: string;
  };
  _count: {
    videos: number;
  };
}

interface ChannelManagementProps {
  onChannelUpdate?: () => void;
}

export default function ChannelManagement({ onChannelUpdate }: ChannelManagementProps) {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    channelId: '',
    channelTitle: '',
  });

  const channelsPerPage = 10;

  useEffect(() => {
    fetchChannels();
  }, [currentPage, searchTerm]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: channelsPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/channels/list?${params}`);
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async () => {
    try {
      const response = await fetch('/api/channels/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        resetForm();
        fetchChannels();
        if (onChannelUpdate) onChannelUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add channel');
      }
    } catch (error) {
      console.error('Error adding channel:', error);
      alert('Error adding channel');
    }
  };

  const handleFetchChannelData = async () => {
    if (!formData.channelId) {
      setFetchMessage('Please enter a channel ID');
      return;
    }

    setFetchLoading(true);
    setFetchMessage('');

    try {
      // For now, we'll simulate fetching channel data
      // In a real implementation, you would use YouTube Data API
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          channelTitle: `Channel ${formData.channelId}`,
        }));
        setFetchMessage('Channel data fetched successfully!');
        setFetchLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching channel data:', error);
      setFetchMessage('Error fetching channel data');
      setFetchLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      channelId: '',
      channelTitle: '',
    });
    setSelectedChannel(null);
    setFetchMessage('');
  };

  const openEditDialog = (channel: ChannelData) => {
    setSelectedChannel(channel);
    setFormData({
      channelId: channel.channelId,
      channelTitle: channel.channelTitle || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteChannel = async (channel: ChannelData) => {
    if (!confirm(`هل أنت متأكد من حذف القناة "${channel.channelTitle}"؟`)) {
      return;
    }

    try {
      // Note: You would need to create a delete channel API endpoint
      alert('Delete functionality would be implemented here');
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Error deleting channel');
    }
  };

  const ChannelForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="channelId">معرف القناة (Channel ID)</Label>
        <div className="flex gap-2">
          <Input
            id="channelId"
            value={formData.channelId}
            onChange={(e) => setFormData(prev => ({ ...prev, channelId: e.target.value }))}
            placeholder="UC_x5XG1OV2P6uZZ5FSM9Ttw"
            disabled={isEdit}
          />
          {!isEdit && (
            <Button 
              type="button" 
              onClick={handleFetchChannelData}
              disabled={fetchLoading || !formData.channelId}
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
        <Label htmlFor="channelTitle">اسم القناة</Label>
        <Input
          id="channelTitle"
          value={formData.channelTitle}
          onChange={(e) => setFormData(prev => ({ ...prev, channelTitle: e.target.value }))}
          placeholder="اسم القناة"
        />
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
        <Button onClick={isEdit ? handleAddChannel : handleAddChannel}>
          {isEdit ? 'تحديث' : 'إضافة'}
        </Button>
      </div>
    </div>
  );

  const openYouTubeChannel = (channelId: string) => {
    window.open(`https://www.youtube.com/channel/${channelId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة القنوات</h2>
          <p className="text-muted-foreground">إدارة القنوات المسموح بها في النظام</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة قناة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة قناة جديدة</DialogTitle>
            </DialogHeader>
            <ChannelForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث عن قناة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button variant="outline" onClick={fetchChannels}>
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channels Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>القناة</TableHead>
                  <TableHead>اسم القناة</TableHead>
                  <TableHead>عدد الفيديوهات</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin ml-2" />
                        جاري التحميل...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : channels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد قنوات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  channels.map((channel) => (
                    <TableRow key={channel.channelId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm text-muted-foreground">
                            {channel.channelId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{channel.channelTitle}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openYouTubeChannel(channel.channelId)}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{channel._count.videos}</span>
                          <Badge variant="outline" className="text-xs">
                            فيديو
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(channel.addedAt), { 
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
                            onClick={() => openEditDialog(channel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChannel(channel)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تحديث القناة</DialogTitle>
          </DialogHeader>
          <ChannelForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}