import { Server as SocketIOServer } from 'socket.io'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { AuditLogger } from '@/lib/audit-logger'
import { UndoRedoManager } from '@/lib/undo-redo-manager'

export interface BlacklistUpdateEvent {
  type: 'blacklist' | 'whitelist'
  action: 'add' | 'remove' | 'modify' | 'expire'
  item: any
  userId?: string
  timestamp: string
  operationId?: string
}

export interface PatternUpdateEvent {
  action: 'add' | 'remove' | 'modify'
  pattern: any
  userId?: string
  timestamp: string
}

export interface FilterUpdateEvent {
  type: 'blacklist' | 'whitelist'
  stats: {
    total: number
    recent: number
    byType: Record<string, number>
  }
  timestamp: string
}

export class BlacklistWebSocketService {
  private io: SocketIOServer
  private connectedClients: Map<string, any> = new Map()

  constructor(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? false 
          : ["http://localhost:3000"],
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)
      
      // Store client connection
      this.connectedClients.set(socket.id, {
        socket,
        connectedAt: new Date(),
        userId: null,
        subscriptions: new Set()
      })

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
        this.connectedClients.delete(socket.id)
      })

      // Handle subscription to blacklist updates
      socket.on('subscribe:blacklist', (data) => {
        const client = this.connectedClients.get(socket.id)
        if (client) {
          client.subscriptions.add('blacklist')
          client.userId = data.userId
          
          // Send current blacklist data
          this.sendCurrentBlacklist(socket)
        }
      })

      // Handle subscription to whitelist updates
      socket.on('subscribe:whitelist', (data) => {
        const client = this.connectedClients.get(socket.id)
        if (client) {
          client.subscriptions.add('whitelist')
          client.userId = data.userId
          
          // Send current whitelist data
          this.sendCurrentWhitelist(socket)
        }
      })

      // Handle subscription to pattern updates
      socket.on('subscribe:patterns', () => {
        const client = this.connectedClients.get(socket.id)
        if (client) {
          client.subscriptions.add('patterns')
          
          // Send current patterns
          this.sendCurrentPatterns(socket)
        }
      })

      // Handle subscription to statistics
      socket.on('subscribe:stats', () => {
        const client = this.connectedClients.get(socket.id)
        if (client) {
          client.subscriptions.add('stats')
          
          // Send current statistics
          this.sendCurrentStats(socket)
        }
      })

      // Handle real-time filtering requests
      socket.on('filter:items', async (data) => {
        try {
          const result = await this.performRealTimeFilter(data.items, data.options)
          socket.emit('filter:result', result)
        } catch (error) {
          socket.emit('filter:error', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
        }
      })

      // Handle undo/redo operations
      socket.on('operation:undo', async (data) => {
        try {
          const success = await UndoRedoManager.undoOperation(
            data.operationId, 
            this.connectedClients.get(socket.id)?.userId
          )
          
          socket.emit('operation:result', {
            type: 'undo',
            operationId: data.operationId,
            success
          })

          if (success) {
            // Broadcast the change to all subscribed clients
            this.broadcastUndoRedoUpdate('undo', data.operationId)
          }
        } catch (error) {
          socket.emit('operation:error', {
            type: 'undo',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      socket.on('operation:redo', async (data) => {
        try {
          const success = await UndoRedoManager.redoOperation(
            data.operationId, 
            this.connectedClients.get(socket.id)?.userId
          )
          
          socket.emit('operation:result', {
            type: 'redo',
            operationId: data.operationId,
            success
          })

          if (success) {
            // Broadcast the change to all subscribed clients
            this.broadcastUndoRedoUpdate('redo', data.operationId)
          }
        } catch (error) {
          socket.emit('operation:error', {
            type: 'redo',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })
    })
  }

  // Broadcast blacklist updates to all subscribed clients
  async broadcastBlacklistUpdate(event: BlacklistUpdateEvent) {
    const clients = Array.from(this.connectedClients.values())
      .filter(client => client.subscriptions.has('blacklist'))

    if (clients.length === 0) return

    // Log the audit event
    await this.logAuditEvent(event)

    // Broadcast to all subscribed clients
    clients.forEach(client => {
      client.socket.emit('blacklist:update', event)
    })
  }

  // Broadcast whitelist updates to all subscribed clients
  async broadcastWhitelistUpdate(event: BlacklistUpdateEvent) {
    const clients = Array.from(this.connectedClients.values())
      .filter(client => client.subscriptions.has('whitelist'))

    if (clients.length === 0) return

    // Log the audit event
    await this.logAuditEvent(event)

    // Broadcast to all subscribed clients
    clients.forEach(client => {
      client.socket.emit('whitelist:update', event)
    })
  }

  // Broadcast pattern updates
  async broadcastPatternUpdate(event: PatternUpdateEvent) {
    const clients = Array.from(this.connectedClients.values())
      .filter(client => client.subscriptions.has('patterns'))

    if (clients.length === 0) return

    // Broadcast to all subscribed clients
    clients.forEach(client => {
      client.socket.emit('patterns:update', event)
    })
  }

  // Broadcast statistics updates
  broadcastStatsUpdate(type: 'blacklist' | 'whitelist') {
    const clients = Array.from(this.connectedClients.values())
      .filter(client => client.subscriptions.has('stats'))

    if (clients.length === 0) return

    // Send updated stats to all subscribed clients
    clients.forEach(client => {
      this.sendCurrentStats(client.socket, type)
    })
  }

  // Broadcast undo/redo updates
  private broadcastUndoRedoUpdate(action: 'undo' | 'redo', operationId: string) {
    const clients = Array.from(this.connectedClients.values())
      .filter(client => client.subscriptions.has('blacklist') || 
                     client.subscriptions.has('whitelist'))

    clients.forEach(client => {
      client.socket.emit('operation:update', {
        action,
        operationId,
        timestamp: new Date().toISOString()
      })
    })
  }

  // Send current blacklist data to a specific client
  private async sendCurrentBlacklist(socket: any) {
    try {
      const blacklisted = await db.blacklistedItem.findMany({
        orderBy: [
          { priority: 'desc' },
          { addedAt: 'desc' }
        ],
        take: 100 // Limit to recent items
      })

      socket.emit('blacklist:current', {
        items: blacklisted,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      socket.emit('error', { 
        message: 'Failed to fetch blacklist data',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Send current whitelist data to a specific client
  private async sendCurrentWhitelist(socket: any) {
    try {
      const whitelisted = await db.whitelistedItem.findMany({
        orderBy: [
          { priority: 'desc' },
          { addedAt: 'desc' }
        ],
        take: 100 // Limit to recent items
      })

      socket.emit('whitelist:current', {
        items: whitelisted,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      socket.emit('error', { 
        message: 'Failed to fetch whitelist data',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Send current patterns to a specific client
  private async sendCurrentPatterns(socket: any) {
    try {
      const patterns = await db.blacklistPattern.findMany({
        where: { isActive: true },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      socket.emit('patterns:current', {
        patterns,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      socket.emit('error', { 
        message: 'Failed to fetch patterns',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Send current statistics to a specific client
  private async sendCurrentStats(socket: any, type?: 'blacklist' | 'whitelist') {
    try {
      if (type) {
        // Send specific type stats
        const stats = await this.getTypeStats(type)
        socket.emit('stats:update', {
          type,
          stats,
          timestamp: new Date().toISOString()
        })
      } else {
        // Send all stats
        const [blacklistStats, whitelistStats] = await Promise.all([
          this.getTypeStats('blacklist'),
          this.getTypeStats('whitelist')
        ])

        socket.emit('stats:current', {
          blacklist: blacklistStats,
          whitelist: whitelistStats,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      socket.emit('error', { 
        message: 'Failed to fetch statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Get statistics for a specific type
  private async getTypeStats(type: 'blacklist' | 'whitelist') {
    const model = type === 'blacklist' ? db.blacklistedItem : db.whitelistedItem
    
    const [total, recent, typeStats] = await Promise.all([
      model.count(),
      model.count({
        where: {
          addedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      model.groupBy({
        by: ['type'],
        _count: { id: true }
      })
    ])

    const byType = typeStats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      recent,
      byType
    }
  }

  // Perform real-time filtering
  private async performRealTimeFilter(items: any[], options: any) {
    // Call the existing filter API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/blacklist/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        ...options
      })
    })

    if (!response.ok) {
      throw new Error('Filtering failed')
    }

    return await response.json()
  }

  // Log audit events for WebSocket operations
  private async logAuditEvent(event: BlacklistUpdateEvent) {
    try {
      await AuditLogger.logAdd(event.type, event.item, {
        userId: event.userId,
        reason: `Real-time update: ${event.action}`
      })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  // Get connection statistics
  getConnectionStats() {
    const clients = Array.from(this.connectedClients.values())
    
    return {
      totalConnections: clients.length,
      blacklistSubscriptions: clients.filter(c => c.subscriptions.has('blacklist')).length,
      whitelistSubscriptions: clients.filter(c => c.subscriptions.has('whitelist')).length,
      patternSubscriptions: clients.filter(c => c.subscriptions.has('patterns')).length,
      statsSubscriptions: clients.filter(c => c.subscriptions.has('stats')).length,
      averageConnectionTime: clients.length > 0 
        ? clients.reduce((sum, c) => sum + (Date.now() - c.connectedAt.getTime()), 0) / clients.length 
        : 0
    }
  }

  // Cleanup old connections
  cleanupOldConnections() {
    const now = Date.now()
    const timeout = 30 * 60 * 1000 // 30 minutes

    for (const [socketId, client] of this.connectedClients.entries()) {
      if (now - client.connectedAt.getTime() > timeout) {
        console.log(`Cleaning up old connection: ${socketId}`)
        client.socket.disconnect()
        this.connectedClients.delete(socketId)
      }
    }
  }
}

// Singleton instance
let blacklistService: BlacklistWebSocketService | null = null

export function getBlacklistWebSocketService(httpServer?: any): BlacklistWebSocketService {
  if (!blacklistService && httpServer) {
    blacklistService = new BlacklistWebSocketService(httpServer)
  }
  return blacklistService!
}