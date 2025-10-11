'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Heart, 
  Users, 
  Video, 
  Calendar,
  Filter,
  Grid,
  List,
  Star,
  TrendingUp,
  Settings,
  MoreHorizontal,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useChannels } from '@/contexts/channels-context';
import { Channel } from '@/contexts/channels-context';

interface ChannelCardProps {
  channel: Channel;
  isGridView: boolean;
}

function ChannelCard({ channel, isGridView }: ChannelCardProps) {
  const { toggleSubscribe } = useChannels();
  const { toast } = useToast();

  const handleSubscribe = () => {
    toggleSubscribe(channel.id);
    toast({
      title: channel.isSubscribed ? 'تم إلغاء الاشتراك' : 'تم الاشتراك',
      description: channel.isSubscribed 
        ? `تم إلغاء اشتراكك من ${channel.name}`
        : `تم اشتراكك في ${channel.name} بنجاح`
    });
  };

  if (isGridView) {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl">
                  {channel.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {channel.isSubscribed && (
                <Badge className="absolute -top-1 -right-1" variant="secondary">
                  <Heart className="w-3 h-3" />
                </Badge>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                {channel.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {channel.description}
              </p>
              
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{channel.subscriberCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  <span>{channel.videoCount}</span>
                </div>
              </div>
              
              <Button
                variant={channel.isSubscribed ? 'secondary' : 'default'}
                size="sm"
                onClick={handleSubscribe}
                className="w-full"
              >
                {channel.isSubscribed ? 'مشترك' : 'اشتراك'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg">
                {channel.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {channel.isSubscribed && (
              <Badge className="absolute -top-1 -right-1" variant="secondary">
                <Heart className="w-3 h-3" />
              </Badge>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">{channel.name}</h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {channel.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{channel.subscriberCount} مشترك</span>
              </div>
              <div className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                <span>{channel.videoCount} فيديو</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>انضم {new Date(channel.joinedDate).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">{channel.category}</Badge>
              <Button
                variant={channel.isSubscribed ? 'secondary' : 'default'}
                size="sm"
                onClick={handleSubscribe}
              >
                {channel.isSubscribed ? 'مشترك' : 'اشتراك'}
              </Button>
            </div>
          </div>
          
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChannelsPage() {
  const { channels, favoriteChannels, searchChannels } = useChannels();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isGridView, setIsGridView] = useState(true);
  const [sortBy, setSortBy] = useState('name');

  const categories = ['all', 'تعليم', 'طبخ', 'ألعاب', 'فن', 'رياضة'];

  const filteredChannels = searchChannels(searchQuery).filter(channel => 
    selectedCategory === 'all' || channel.category === selectedCategory
  );

  const sortedChannels = [...filteredChannels].sort((a, b) => {
    switch (sortBy) {
      case 'subscribers':
        return parseInt(b.subscriberCount) - parseInt(a.subscriberCount);
      case 'videos':
        return parseInt(b.videoCount) - parseInt(a.videoCount);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">القنوات</h1>
            <p className="text-muted-foreground">اكتشف وإدارة قناتك المفضلة</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 h-4" />
            جميع القنوات ({channels.length})
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 h-4" />
            المشتركات ({favoriteChannels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="بحث في القنوات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {categories.filter(cat => cat !== 'all').map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">الاسم</SelectItem>
                      <SelectItem value="subscribers">المشتركين</SelectItem>
                      <SelectItem value="videos">الفيديوهات</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex border rounded-md">
                    <Button
                      variant={isGridView ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setIsGridView(true)}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={!isGridView ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setIsGridView(false)}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Channels Grid/List */}
          {sortedChannels.length > 0 ? (
            <div className={isGridView 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {sortedChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isGridView={isGridView}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا توجد قنوات</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'لا توجد قنوات تطابق بحثك' : 'ابدأ بإضافة قناتك المفضلة'}
                </p>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة قناة جديدة
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-6">
          {favoriteChannels.length > 0 ? (
            <div className={isGridView 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
              {favoriteChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isGridView={isGridView}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا توجد قنوات مفضلة</h3>
                <p className="text-muted-foreground mb-4">
                  اشترك في القنوات التي تهمك لإضافتها إلى المفضلة
                </p>
                <Button variant="outline">
                  <Users className="h-4 w-4 ml-2" />
                  استكشف القنوات
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}