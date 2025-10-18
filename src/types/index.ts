export interface Video {
  id: number
  title: string
  channel: string
  views: string
  timestamp: string
  thumbnail: string
  channelAvatar: string
  duration: string
}

export interface MenuItem {
  icon: any
  label: string
  description?: string
  active?: boolean
}

export interface UserProfile {
  name: string
  email: string
  avatar: string
}

export interface ThemeOption {
  value: 'light' | 'dark' | 'system'
  label: string
  icon: any
}