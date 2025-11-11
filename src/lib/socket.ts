import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle joining rooms for different data types
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Handle leaving rooms
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // Broadcast favorite updates
    socket.on('favorites-updated', (data: { type: 'added' | 'removed', item: any }) => {
      socket.broadcast.emit('favorites-changed', data);
      console.log('Favorites update broadcasted:', data);
    });

    // Broadcast notes updates
    socket.on('notes-updated', (data: { type: 'added' | 'updated' | 'removed', note: any }) => {
      socket.broadcast.emit('notes-changed', data);
      console.log('Notes update broadcasted:', data);
    });

    // Handle messages (keep existing functionality)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message to all clients except the sender
      socket.broadcast.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Real-time YouTube Clone!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};