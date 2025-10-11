'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Channel {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  isSubscribed: boolean;
  category: string;
  joinedDate: string;
}

interface ChannelsContextType {
  channels: Channel[];
  favoriteChannels: Channel[];
  addChannel: (channel: Omit<Channel, 'id'>) => void;
  removeChannel: (channelId: string) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  toggleFavorite: (channelId: string) => void;
  toggleSubscribe: (channelId: string) => void;
  getChannel: (channelId: string) => Channel | undefined;
  searchChannels: (query: string) => Channel[];
}

const ChannelsContext = createContext<ChannelsContextType | undefined>(undefined);

// Mock data for initial channels
const mockChannels: Channel[] = [
  {
    id: '1',
    name: 'قناة ماي يوتيوب التعليمية',
    description: 'قناة متخصصة في تقديم محتوى تعليمي عالي الجودة في مجال البرمجة والتكنولوجيا',
    thumbnailUrl: 'https://picsum.photos/seed/channel1/200/200.jpg',
    subscriberCount: '1.2M',
    videoCount: '245',
    isSubscribed: true,
    category: 'تعليم',
    joinedDate: '2020-03-15'
  },
  {
    id: '2',
    name: 'قناة الطبخ العربي',
    description: 'أفضل الوصفات العربية والعالمية بطريقة سهلة ومبسطة',
    thumbnailUrl: 'https://picsum.photos/seed/channel2/200/200.jpg',
    subscriberCount: '856K',
    videoCount: '189',
    isSubscribed: false,
    category: 'طبخ',
    joinedDate: '2019-07-22'
  },
  {
    id: '3',
    name: 'قناة الألعاب العربية',
    description: 'مراجعات وأخبار عالم الألعاب باللغة العربية',
    thumbnailUrl: 'https://picsum.photos/seed/channel3/200/200.jpg',
    subscriberCount: '2.1M',
    videoCount: '412',
    isSubscribed: true,
    category: 'ألعاب',
    joinedDate: '2018-11-08'
  },
  {
    id: '4',
    name: 'قناة الفنون العربية',
    description: 'كل ما هو جديد في عالم الفن والثقافة العربية',
    thumbnailUrl: 'https://picsum.photos/seed/channel4/200/200.jpg',
    subscriberCount: '643K',
    videoCount: '156',
    isSubscribed: false,
    category: 'فن',
    joinedDate: '2021-01-30'
  },
  {
    id: '5',
    name: 'قناة اللياقة البدنية',
    description: 'تمارين ونصائح للعيش حياة صحية ونشطة',
    thumbnailUrl: 'https://picsum.photos/seed/channel5/200/200.jpg',
    subscriberCount: '934K',
    videoCount: '278',
    isSubscribed: true,
    category: 'رياضة',
    joinedDate: '2020-09-12'
  }
];

export function ChannelsProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>(mockChannels);

  const favoriteChannels = channels.filter(channel => channel.isSubscribed);

  const addChannel = (channelData: Omit<Channel, 'id'>) => {
    const newChannel: Channel = {
      ...channelData,
      id: Date.now().toString()
    };
    setChannels(prev => [...prev, newChannel]);
  };

  const removeChannel = (channelId: string) => {
    setChannels(prev => prev.filter(channel => channel.id !== channelId));
  };

  const updateChannel = (channelId: string, updates: Partial<Channel>) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.id === channelId ? { ...channel, ...updates } : channel
      )
    );
  };

  const toggleFavorite = (channelId: string) => {
    setChannels(prev => 
      prev.map(channel => 
        channel.id === channelId 
          ? { ...channel, isSubscribed: !channel.isSubscribed }
          : channel
      )
    );
  };

  const toggleSubscribe = (channelId: string) => {
    toggleFavorite(channelId);
  };

  const getChannel = (channelId: string) => {
    return channels.find(channel => channel.id === channelId);
  };

  const searchChannels = (query: string) => {
    if (!query.trim()) return channels;
    
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(query.toLowerCase()) ||
      channel.description.toLowerCase().includes(query.toLowerCase()) ||
      channel.category.toLowerCase().includes(query.toLowerCase())
    );
  };

  return (
    <ChannelsContext.Provider value={{
      channels,
      favoriteChannels,
      addChannel,
      removeChannel,
      updateChannel,
      toggleFavorite,
      toggleSubscribe,
      getChannel,
      searchChannels
    }}>
      {children}
    </ChannelsContext.Provider>
  );
}

export function useChannels() {
  const context = useContext(ChannelsContext);
  if (context === undefined) {
    throw new Error('useChannels must be used within a ChannelsProvider');
  }
  return context;
}