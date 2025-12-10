export interface NoteCustomizationOptions {
  // Display Options
  viewMode: 'grid' | 'list' | 'compact'
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'duration' | 'startTime'
  sortOrder: 'asc' | 'desc'
  
  // Filter Options
  filterBy: 'all' | 'clips' | 'notes' | 'favorites'
  timeRange: 'all' | 'today' | 'week' | 'month' | 'year'
  
  // Visual Options
  cardSize: 'small' | 'medium' | 'large'
  showThumbnails: boolean
  showTimestamps: boolean
  showDurations: boolean
  showChannelInfo: boolean
  
  // Content Options
  maxContentLength: number
  truncateTitle: boolean
  highlightKeywords: boolean
  
  // Interaction Options
  quickActions: boolean
  swipeActions: boolean
  longPressActions: boolean
  
  // Advanced Options
  autoSave: boolean
  syncWithVideo: boolean
  enableRichText: boolean
  enableAttachments: boolean
}

export interface FavoriteCustomizationOptions {
  // Display Options
  viewMode: 'grid' | 'list' | 'compact'
  sortBy: 'addedAt' | 'title' | 'viewCount' | 'duration'
  sortOrder: 'asc' | 'desc'
  
  // Filter Options
  filterBy: 'all' | 'channels' | 'highViews' | 'recent'
  timeRange: 'all' | 'today' | 'week' | 'month' | 'year'
  
  // Visual Options
  cardSize: 'small' | 'medium' | 'large'
  showThumbnails: boolean
  showViewCounts: boolean
  showDurations: boolean
  showChannelInfo: boolean
  
  // Content Options
  maxTitleLength: number
  truncateDescription: boolean
  showBadges: boolean
  
  // Interaction Options
  quickActions: boolean
  swipeActions: boolean
  longPressActions: boolean
  
  // Advanced Options
  autoSync: boolean
  enablePlaylists: boolean
  enableCategories: boolean
  enablePriority: boolean
}

export interface NoteAppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  shadowIntensity: 'none' | 'low' | 'medium' | 'high'
  animationSpeed: 'slow' | 'normal' | 'fast'
}

export interface FavoriteAppearanceSettings {
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  shadowIntensity: 'none' | 'low' | 'medium' | 'high'
  animationSpeed: 'slow' | 'normal' | 'fast'
}

export interface AdvancedNoteFeatures {
  // Rich Text Features
  enableMarkdown: boolean
  enableEmojis: boolean
  enableHashtags: boolean
  enableMentions: boolean
  
  // Media Features
  enableImageAttachments: boolean
  enableVideoPreviews: boolean
  enableAudioNotes: boolean
  
  // Organization Features
  enableCategories: boolean
  enableTags: boolean
  enablePriority: boolean
  enableDueDates: boolean
  
  // Collaboration Features
  enableSharing: boolean
  enableComments: boolean
  enableCollaboration: boolean
  
  // Export Features
  enableExport: boolean
  exportFormats: ('json' | 'csv' | 'markdown')[]
}

export interface AdvancedFavoriteFeatures {
  // Organization Features
  enablePlaylists: boolean
  enableCategories: boolean
  enableTags: boolean
  enablePriority: boolean
  
  // Discovery Features
  enableRecommendations: boolean
  enableTrending: boolean
  enableSimilarVideos: boolean
  
  // Management Features
  enableBatchOperations: boolean
  enableAutoCategorization: boolean
  enableSmartFilters: boolean
  
  // Sharing Features
  enableSharing: boolean
  enableCollaborativePlaylists: boolean
  enablePublicSharing: boolean
  
  // Analytics Features
  enableViewTracking: boolean
  enableEngagementStats: boolean
  enableWatchTimeAnalytics: boolean
}