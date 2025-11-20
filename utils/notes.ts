import { VideoNote } from '@/types/notes'

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function generateNoteTitle(videoTitle: string, startTime?: number, endTime?: number): string {
  if (startTime !== undefined && endTime !== undefined) {
    return `Clip from ${formatTime(startTime)} to ${formatTime(endTime)} - ${videoTitle}`
  }
  
  return `Note - ${videoTitle}`
}

export function validateNoteTime(startTime: number, endTime: number): boolean {
  return startTime >= 0 && endTime > startTime
}

export function getNoteDuration(note: VideoNote): number {
  if (note.startTime !== undefined && note.endTime !== undefined) {
    return note.endTime - note.startTime
  }
  return 0
}

export function isNoteClip(note: VideoNote): boolean {
  return note.isClip === true && note.startTime !== undefined && note.endTime !== undefined
}

export function sortNotesByTime(notes: VideoNote[]): VideoNote[] {
  return [...notes].sort((a, b) => {
    const aTime = a.startTime || 0
    const bTime = b.startTime || 0
    return aTime - bTime
  })
}

export function filterNotesByVideo(notes: VideoNote[], videoId: string): VideoNote[] {
  return notes.filter(note => note.videoId === videoId)
}

export function searchNotes(notes: VideoNote[], query: string): VideoNote[] {
  const lowercaseQuery = query.toLowerCase()
  return notes.filter(note => 
    note.title.toLowerCase().includes(lowercaseQuery) ||
    note.note.toLowerCase().includes(lowercaseQuery) ||
    note.channelName.toLowerCase().includes(lowercaseQuery)
  )
}

export function getNotesStats(notes: VideoNote[]): {
  total: number
  clips: number
  regularNotes: number
  totalDuration: number
} {
  const clips = notes.filter(note => isNoteClip(note))
  const regularNotes = notes.filter(note => !isNoteClip(note))
  const totalDuration = clips.reduce((sum, note) => sum + getNoteDuration(note), 0)
  
  return {
    total: notes.length,
    clips: clips.length,
    regularNotes: regularNotes.length,
    totalDuration
  }
}