import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Video {
  id: string
  title: string
  channel: string
  thumbnail: string
  duration: string
  views: string
  published: string
  url: string
}

interface Playlist {
  id: string
  name: string
  videos: Video[]
  createdAt: string
}

interface NewPipeStore {
  // History
  history: Video[]
  addToHistory: (video: Video) => void
  removeFromHistory: (videoId: string) => void
  clearHistory: () => void

  // Bookmarks
  bookmarks: Video[]
  addBookmark: (video: Video) => void
  removeBookmark: (videoId: string) => void
  isBookmarked: (videoId: string) => boolean

  // Subscriptions
  subscriptions: string[]
  subscribe: (channelName: string) => void
  unsubscribe: (channelName: string) => void
  isSubscribed: (channelName: string) => boolean

  // Playlists
  playlists: Playlist[]
  createPlaylist: (name: string) => void
  deletePlaylist: (playlistId: string) => void
  addToPlaylist: (playlistId: string, video: Video) => void
  removeFromPlaylist: (playlistId: string, videoId: string) => void

  // Downloads
  downloads: Video[]
  addDownload: (video: Video) => void
  removeDownload: (videoId: string) => void
  isDownloaded: (videoId: string) => boolean
}

export const useNewPipeStore = create<NewPipeStore>()(
  persist(
    (set, get) => ({
      // History
      history: [],
      addToHistory: (video) =>
        set((state) => {
          // Remove if already exists to avoid duplicates
          const filteredHistory = state.history.filter((v) => v.id !== video.id)
          return {
            history: [video, ...filteredHistory].slice(0, 100) // Keep last 100 videos
          }
        }),
      removeFromHistory: (videoId) =>
        set((state) => ({
          history: state.history.filter((v) => v.id !== videoId)
        })),
      clearHistory: () => set({ history: [] }),

      // Bookmarks
      bookmarks: [],
      addBookmark: (video) =>
        set((state) => {
          if (!state.bookmarks.some((v) => v.id === video.id)) {
            return { bookmarks: [...state.bookmarks, video] }
          }
          return state
        }),
      removeBookmark: (videoId) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((v) => v.id !== videoId)
        })),
      isBookmarked: (videoId) => get().bookmarks.some((v) => v.id === videoId),

      // Subscriptions
      subscriptions: [],
      subscribe: (channelName) =>
        set((state) => {
          if (!state.subscriptions.includes(channelName)) {
            return { subscriptions: [...state.subscriptions, channelName] }
          }
          return state
        }),
      unsubscribe: (channelName) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((c) => c !== channelName)
        })),
      isSubscribed: (channelName) => get().subscriptions.includes(channelName),

      // Playlists
      playlists: [],
      createPlaylist: (name) =>
        set((state) => ({
          playlists: [
            ...state.playlists,
            {
              id: Date.now().toString(),
              name,
              videos: [],
              createdAt: new Date().toISOString()
            }
          ]
        })),
      deletePlaylist: (playlistId) =>
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId)
        })),
      addToPlaylist: (playlistId, video) =>
        set((state) => {
          const playlistIndex = state.playlists.findIndex((p) => p.id === playlistId)
          if (playlistIndex === -1) return state

          const playlist = state.playlists[playlistIndex]
          if (!playlist.videos.some((v) => v.id === video.id)) {
            const updatedPlaylists = [...state.playlists]
            updatedPlaylists[playlistIndex] = {
              ...playlist,
              videos: [...playlist.videos, video]
            }
            return { playlists: updatedPlaylists }
          }
          return state
        }),
      removeFromPlaylist: (playlistId, videoId) =>
        set((state) => {
          const playlistIndex = state.playlists.findIndex((p) => p.id === playlistId)
          if (playlistIndex === -1) return state

          const playlist = state.playlists[playlistIndex]
          const updatedPlaylists = [...state.playlists]
          updatedPlaylists[playlistIndex] = {
            ...playlist,
            videos: playlist.videos.filter((v) => v.id !== videoId)
          }
          return { playlists: updatedPlaylists }
        }),

      // Downloads
      downloads: [],
      addDownload: (video) =>
        set((state) => {
          if (!state.downloads.some((v) => v.id === video.id)) {
            return { downloads: [...state.downloads, video] }
          }
          return state
        }),
      removeDownload: (videoId) =>
        set((state) => ({
          downloads: state.downloads.filter((v) => v.id !== videoId)
        })),
      isDownloaded: (videoId) => get().downloads.some((v) => v.id === videoId)
    }),
    {
      name: 'newpipe-storage',
      // Only persist these fields
      partialize: (state) => ({
        history: state.history,
        bookmarks: state.bookmarks,
        subscriptions: state.subscriptions,
        playlists: state.playlists,
        downloads: state.downloads
      })
    }
  )
)