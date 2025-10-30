// Dynamic loading messages for different operations
export const loadingMessages = {
  search: [
    "Searching YouTube...",
    "Finding relevant videos...",
    "Fetching results...",
    "Almost there...",
    "Preparing your videos..."
  ],
  loadMore: [
    "Loading more videos...",
    "Fetching additional content...",
    "Expanding results...",
    "Getting more videos..."
  ],
  favorites: {
    add: [
      "Adding to favorites...",
      "Saving your choice...",
      "Updating favorites..."
    ],
    remove: [
      "Removing from favorites...",
      "Updating your list...",
      "Refreshing favorites..."
    ]
  },
  notes: {
    save: [
      "Saving your note...",
      "Storing thoughts...",
      "Updating notes..."
    ],
    load: [
      "Loading notes...",
      "Fetching your thoughts...",
      "Preparing notes..."
    ],
    delete: [
      "Deleting note...",
      "Removing thoughts...",
      "Updating notes..."
    ]
  },
  channels: {
    follow: [
      "Following channel...",
      "Adding to favorites...",
      "Updating subscriptions..."
    ],
    unfollow: [
      "Unfollowing channel...",
      "Removing from favorites...",
      "Updating subscriptions..."
    ]
  },
  general: [
    "Processing...",
    "Working on it...",
    "Just a moment...",
    "Almost done...",
    "Finalizing..."
  ]
}

// Smart confirmation messages with contextual awareness
export const smartConfirmationMessages = {
  search: {
    initial: (count: number, query: string) => [
      `Found ${count} videos for "${query}"!`,
      `Discovered ${count} videos matching "${query}"`,
      `Search complete: ${count} videos for "${query}"`,
      `${count} videos found for "${query}"`
    ],
    loadMore: (count: number, total: number) => [
      `Loaded ${count} more videos (${total} total)`,
      `Added ${count} more videos to results`,
      `Now showing ${total} videos`,
      `${count} additional videos loaded`
    ],
    noResults: (query: string) => [
      `No videos found for "${query}"`,
      `No results match "${query}"`,
      `Try different keywords for "${query}"`,
      `No videos available for "${query}"`
    ],
    noMore: () => [
      "All available videos loaded",
      "Reached the end of results",
      "No more videos available",
      "All videos have been loaded"
    ]
  },
  favorites: {
    add: (videoTitle: string) => [
      `"${videoTitle}" added to favorites!`,
      `Saved "${videoTitle}" to your favorites`,
      `${videoTitle} is now in your favorites`,
      `Added to favorites: ${videoTitle}`
    ],
    remove: (videoTitle: string) => [
      `"${videoTitle}" removed from favorites`,
      `Removed "${videoTitle}" from your list`,
      `${videoTitle} is no longer in favorites`,
      `Removed from favorites: ${videoTitle}`
    ],
    bulkAdd: (count: number) => [
      `Added ${count} videos to favorites!`,
      `${count} videos saved to favorites`,
      `Bulk added: ${count} videos`,
      `Successfully added ${count} videos`
    ],
    bulkRemove: (count: number) => [
      `Removed ${count} videos from favorites`,
      `${count} videos removed from favorites`,
      `Bulk removed: ${count} videos`,
      `Successfully removed ${count} videos`
    ]
  },
  notes: {
    save: (videoTitle: string, timeRange?: string) => {
      const baseMessages = [
        `Note saved for "${videoTitle}"`,
        `Thoughts recorded for ${videoTitle}`,
        `Note added to "${videoTitle}"`
      ]
      
      if (timeRange) {
        return [
          `Note saved for "${videoTitle}" at ${timeRange}`,
          `Thoughts recorded at ${timeRange}`,
          `Note added at ${timeRange}`,
          ...baseMessages
        ]
      }
      
      return baseMessages
    },
    delete: (noteContent: string) => [
      `Note deleted: "${noteContent.substring(0, 30)}${noteContent.length > 30 ? '...' : ''}"`,
      `Removed note: "${noteContent.substring(0, 30)}${noteContent.length > 30 ? '...' : ''}"`,
      `Note deleted successfully`,
      `Thought removed from notes`
    ],
    bulkDelete: (count: number) => [
      `Deleted ${count} notes`,
      `Removed ${count} thoughts`,
      `${count} notes deleted successfully`,
      `Bulk deleted: ${count} notes`
    ],
    play: (noteContent: string, timeRange: string) => [
      `Playing: "${noteContent.substring(0, 40)}${noteContent.length > 40 ? '...' : ''}"`,
      `Now playing at ${timeRange}`,
      `Playing note from ${timeRange}`,
      `Note playback started`
    ]
  },
  channels: {
    follow: (channelName: string, subscriberCount?: string) => {
      const baseMessages = [
        `Now following "${channelName}"`,
        `Subscribed to ${channelName}`,
        `Added "${channelName}" to your channels`,
        `${channelName} is now in your subscriptions`
      ]
      
      if (subscriberCount) {
        return [
          `Following "${channelName}" (${subscriberCount})`,
          `Subscribed to ${channelName} (${subscriberCount})`,
          ...baseMessages
        ]
      }
      
      return baseMessages
    },
    unfollow: (channelName: string) => [
      `Unfollowed "${channelName}"`,
      `Removed "${channelName}" from subscriptions`,
      `No longer following ${channelName}`,
      `${channelName} removed from channels`
    ]
  },
  navigation: {
    tabSwitch: (tabName: string, itemCount?: number) => {
      const tabMessages: Record<string, string[]> = {
        home: ["Welcome to Home", "Back to Home", "Home screen"],
        search: ["Search videos", "Find new content", "Search screen"],
        player: ["Video player", "Now playing", "Player view"],
        watched: ["Recently watched", "Your history", "Watched videos"],
        channels: ["Your channels", "Subscriptions", "Channel list"],
        favorites: ["Your favorites", "Saved videos", "Favorite videos"],
        notes: ["Your notes", "Video notes", "Thoughts and notes"]
      }
      
      const messages = tabMessages[tabName] || ["Switched to " + tabName]
      
      if (itemCount !== undefined) {
        return [
          `${messages[0]} (${itemCount} items)`,
          `${messages[1]} (${itemCount} items)`,
          ...messages
        ]
      }
      
      return messages
    }
  },
  multiSelect: {
    enabled: (count: number) => [
      `Multi-select mode: ${count} items available`,
      `Select multiple items (${count} total)`,
      `Bulk actions enabled (${count} items)`,
      `Multi-select on: ${count} items`
    ],
    selection: (selected: number, total: number) => [
      `${selected} of ${total} items selected`,
      `Selected ${selected} items`,
      `${selected} items chosen`,
      `Multi-select: ${selected}/${total}`
    ],
    action: (action: string, count: number) => [
      `${action} ${count} selected items`,
      `Processing ${count} items...`,
      `${action} complete: ${count} items`,
      `Bulk ${action}: ${count} items`
    ]
  },
  settings: {
    autoLoad: (enabled: boolean) => [
      `Auto-load ${enabled ? 'enabled' : 'disabled'}`,
      `Automatic loading ${enabled ? 'turned on' : 'turned off'}`,
      `Auto-load videos ${enabled ? 'enabled' : 'disabled'}`,
      `${enabled ? 'Will' : 'Will not'} load videos automatically`
    ]
  }
}

export const confirmationMessages = {
  search: (count: number) => [
    `Found ${count} videos!`,
    "Search complete!",
    "Results loaded!",
    "Ready to explore!"
  ],
  favorites: {
    add: [
      "Added to favorites!",
      "Video saved!",
      "Favorites updated!"
    ],
    remove: [
      "Removed from favorites!",
      "Video removed!",
      "Favorites updated!"
    ]
  },
  notes: {
    save: [
      "Note saved!",
      "Thoughts stored!",
      "Note added successfully!"
    ],
    delete: [
      "Note deleted!",
      "Thoughts removed!",
      "Note removed!"
    ]
  },
  channels: {
    follow: [
      "Channel followed!",
      "Added to favorites!",
      "Subscription updated!"
    ],
    unfollow: [
      "Channel unfollowed!",
      "Removed from favorites!",
      "Subscription updated!"
    ]
  },
  general: [
    "Success!",
    "Complete!",
    "Done!",
    "Ready!"
  ]
}

export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

export function getLoadingMessage(operation: keyof typeof loadingMessages): string {
  const messages = loadingMessages[operation]
  if (Array.isArray(messages)) {
    return getRandomMessage(messages)
  } else {
    // For nested objects like favorites, notes, channels
    const actionMessages = Object.values(messages).flat()
    return getRandomMessage(actionMessages)
  }
}

export function getConfirmationMessage(operation: keyof typeof confirmationMessages, ...args: any[]): string {
  const messages = confirmationMessages[operation]
  if (typeof messages === 'function') {
    return getRandomMessage(messages(...args))
  } else if (Array.isArray(messages)) {
    return getRandomMessage(messages)
  } else {
    // For nested objects
    const actionMessages = Object.values(messages).flat()
    return getRandomMessage(actionMessages)
  }
}

export function getSmartConfirmationMessage(category: keyof typeof smartConfirmationMessages, action: string, ...args: any[]): string {
  const categoryMessages = smartConfirmationMessages[category]
  
  if (categoryMessages && typeof categoryMessages === 'object' && action in categoryMessages) {
    const actionMessages = categoryMessages[action as keyof typeof categoryMessages]
    if (typeof actionMessages === 'function') {
      const messages = actionMessages(...args)
      return getRandomMessage(messages)
    } else if (Array.isArray(actionMessages)) {
      return getRandomMessage(actionMessages)
    }
  }
  
  // Fallback to regular confirmation messages
  return getConfirmationMessage(category as keyof typeof confirmationMessages, ...args)
}