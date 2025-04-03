import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/next';

export const config = {
  api: {
    bodyParser: false,
  },
};

let io: ServerIO | null = null;

const ioHandler = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    const httpServer: NetServer = res.socket.server as any;
    
    io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      transports: ['websocket'],
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      connectTimeout: 5000,
      pingTimeout: 10000,
      pingInterval: 5000,
      maxHttpBufferSize: 1e6, // 1 MB
      perMessageDeflate: true,
      httpCompression: true
    });

    // Store the io instance on the server
    res.socket.server.io = io;

    // Handle socket events
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      // Authenticate socket
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('Socket authentication failed');
        socket.disconnect();
        return;
      }
      console.log('Socket authenticated for user:', token);

      // Join chat room
      socket.on('join_chat', ({ chatId }) => {
        if (!chatId) {
          console.log('No chatId provided');
          return;
        }
        
        // Leave previous rooms except socket ID
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });
        
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
        
        // Notify room that user has joined
        io?.to(chatId).emit('user_joined', {
          userId: token,
          timestamp: new Date().toISOString()
        });
      });

      // Handle messages
      socket.on('send_message', (message) => {
        const rooms = Array.from(socket.rooms);
        // First room is always the socket ID, second is the chat room
        const chatId = rooms[1];
        
        if (!chatId || !message.content) {
          console.log('Invalid message or no chat room');
          return;
        }

        console.log(`Sending message in chat ${chatId}:`, message);

        const enhancedMessage = {
          ...message,
          sender: token,
          timestamp: new Date().toISOString()
        };

        io?.to(chatId).emit('message', enhancedMessage);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        const rooms = Array.from(socket.rooms);
        const chatId = rooms[1];
        
        if (chatId) {
          io?.to(chatId).emit('user_left', {
            userId: token,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        socket.disconnect();
      });
    });

    // Clean up disconnected sockets periodically
    setInterval(() => {
      if (io) {
        const sockets = Array.from(io.sockets.sockets.values());
        sockets.forEach(socket => {
          if (!socket.connected) {
            socket.disconnect(true);
          }
        });
      }
    }, 30000); // Every 30 seconds
  } else {
    console.log('Socket.IO server already running');
  }

  res.end();
};

export default ioHandler; 