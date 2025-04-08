import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/next';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'],
      pingTimeout: 60000,
      pingInterval: 25000,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      allowEIO3: true
    });

    // Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Authenticate the socket connection
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('No auth token provided');
        socket.disconnect();
        return;
      }

      // Store user information
      socket.data.userEmail = token;

      socket.on('join-chat', (chatId: string) => {
        console.log(`Client ${socket.id} joined chat:`, chatId);
        socket.join(chatId);
        // Notify others in the room
        socket.to(chatId).emit('user-joined', { userEmail: socket.data.userEmail });
      });

      socket.on('leave-chat', (chatId: string) => {
        console.log(`Client ${socket.id} left chat:`, chatId);
        socket.leave(chatId);
        // Notify others in the room
        socket.to(chatId).emit('user-left', { userEmail: socket.data.userEmail });
      });

      socket.on('send-message', async (data: { chatId: string; message: string; sender: string }) => {
        console.log('Message received:', data);
        
        try {
          const messageData = {
            _id: new Date().getTime().toString(),
            content: data.message,
            sender: data.sender,
            timestamp: new Date().toISOString()
          };

          // Broadcast message to all clients in the chat room except sender
          socket.to(data.chatId).emit('new-message', messageData);
          
          // Send confirmation back to sender
          socket.emit('message-sent', messageData);
        } catch (error) {
          console.error('Error handling message:', error);
          socket.emit('message-error', { error: 'Failed to send message' });
        }
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected (${reason}):`, socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default ioHandler; 