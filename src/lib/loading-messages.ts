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

export function getConfirmationMessage(operation: keyof typeof confirmationMessages, args: any[]): string {
  const messages = confirmationMessages[operation]
  if (typeof messages === 'function') {
    const result = messages(args[0]) // Pass first argument as count
    return Array.isArray(result) ? getRandomMessage(result) : String(result)
  } else if (Array.isArray(messages)) {
    return getRandomMessage(messages)
  } else {
    // For nested objects
    const actionMessages = Object.values(messages).flat() as string[]
    return getRandomMessage(actionMessages)
  }
}