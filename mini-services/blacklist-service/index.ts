import { createServer } from 'http'
import { getBlacklistWebSocketService } from '../lib/blacklist-websocket-service'

const PORT = 3003
const HOST = '0.0.0.0'

// Create HTTP server for Socket.IO
const httpServer = createServer()

// Initialize blacklist WebSocket service
const blacklistService = getBlacklistWebSocketService(httpServer)

// Add notification endpoint for API integration
httpServer.on('request', (req, res) => {
  if (req.method === 'POST' && req.url === '/notify') {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      try {
        const event = JSON.parse(body)
        
        if (event.type === 'blacklist') {
          blacklistService.broadcastBlacklistUpdate(event)
        } else if (event.type === 'whitelist') {
          blacklistService.broadcastWhitelistUpdate(event)
        } else if (event.type === 'pattern') {
          blacklistService.broadcastPatternUpdate(event)
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
  } else {
    res.writeHead(404)
    res.end()
  }
})

// Start the server
httpServer.listen(PORT, HOST, () => {
  console.log(`🔌 Blacklist WebSocket Server running on port ${PORT}`)
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`)
  console.log(`🌐 HTTP endpoint: http://localhost:${PORT}`)
  
  // Log connection stats every 30 seconds
  setInterval(() => {
    const stats = blacklistService.getConnectionStats()
    console.log('📊 Connection Stats:', stats)
  }, 30000)

  // Cleanup old connections every 5 minutes
  setInterval(() => {
    blacklistService.cleanupOldConnections()
  }, 5 * 60 * 1000)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down Blacklist WebSocket server...')
  httpServer.close(() => {
    console.log('✅ Blacklist WebSocket server stopped')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 Shutting down Blacklist WebSocket server...')
  httpServer.close(() => {
    console.log('✅ Blacklist WebSocket server stopped')
    process.exit(0)
  })
})