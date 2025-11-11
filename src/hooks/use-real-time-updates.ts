'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface RealTimeUpdateData {
  type: 'added' | 'updated' | 'removed'
  video?: any
  item?: any
  note?: any
}

interface UseRealTimeUpdatesProps {
  onWatchedChanged?: (data: RealTimeUpdateData) => void
  onFavoritesChanged?: (data: RealTimeUpdateData) => void
  onNotesChanged?: (data: RealTimeUpdateData) => void
  onMessage?: (data: { text: string; senderId: string; timestamp: string }) => void
}

export function useRealTimeUpdates({
  onWatchedChanged,
  onFavoritesChanged,
  onNotesChanged,
  onMessage
}: UseRealTimeUpdatesProps = {}) {
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    try {
      // Connect to the Socket.IO server
      const socket = io('http://localhost:3001', {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      })

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Connected to real-time updates server')
        reconnectAttempts.current = 0
        
        // Join default rooms for different data types
        socket.emit('join-room', 'watched')
        socket.emit('join-room', 'favorites')
        socket.emit('join-room', 'notes')
      })

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from real-time updates server:', reason)
        
        // Attempt to reconnect if not manually disconnected
        if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`)
          setTimeout(connect, 2000 * reconnectAttempts.current)
        }
      })

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message)
      })

      // Handle real-time data updates
      socket.on('watched-changed', (data: RealTimeUpdateData) => {
        console.log('Watched videos updated:', data)
        onWatchedChanged?.(data)
      })

      socket.on('favorites-changed', (data: RealTimeUpdateData) => {
        console.log('Favorites updated:', data)
        onFavoritesChanged?.(data)
      })

      socket.on('notes-changed', (data: RealTimeUpdateData) => {
        console.log('Notes updated:', data)
        onNotesChanged?.(data)
      })

      // Handle messages (keep existing functionality)
      socket.on('message', (data: { text: string; senderId: string; timestamp: string }) => {
        console.log('Message received:', data)
        onMessage?.(data)
      })

    } catch (error) {
      console.error('Failed to connect to real-time updates server:', error)
    }
  }, [onWatchedChanged, onFavoritesChanged, onNotesChanged, onMessage])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const emitWatchedUpdate = useCallback((data: RealTimeUpdateData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('watched-updated', data)
    }
  }, [])

  const emitFavoritesUpdate = useCallback((data: RealTimeUpdateData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('favorites-updated', data)
    }
  }, [])

  const emitNotesUpdate = useCallback((data: RealTimeUpdateData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('notes-updated', data)
    }
  }, [])

  const sendMessage = useCallback((text: string, senderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', { text, senderId })
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
    emitWatchedUpdate,
    emitFavoritesUpdate,
    emitNotesUpdate,
    sendMessage
  }
}