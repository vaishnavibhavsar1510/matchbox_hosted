import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ObjectId } from 'mongodb';

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/matchbox';

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-chat', (chatId: string) => {
        console.log(`Client ${socket.id} joined chat:`, chatId);
        socket.join(chatId);
      });

      socket.on('leave-chat', (chatId: string) => {
        console.log(`Client ${socket.id} left chat:`, chatId);
        socket.leave(chatId);
      });

      socket.on('send-message', async (data: { chatId: string; message: string; sender: string }) => {
        console.log('Message received:', data);
        const { chatId, message, sender } = data;
        
        try {
          // Connect to MongoDB
          const client = await MongoClient.connect(MONGODB_URI);
          const db = client.db();
          
          // Create message object
          const messageObj = {
            sender,
            content: message,
            timestamp: new Date(),
          };

          // Store message in database
          await db.collection('chats').updateOne(
            { _id: new ObjectId(chatId) },
            { 
              $push: { 
                messages: {
                  $each: [messageObj]
                }
              },
              $set: { updatedAt: new Date() }
            }
          );

          // Broadcast message to chat room
          io.to(chatId).emit('new-message', messageObj);

          await client.close();
        } catch (error) {
          console.error('Error storing message:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  res.end();
};

export default ioHandler; 