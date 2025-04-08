import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiResponseServerIO } from '../../../types/next';
import { UpdateResult } from 'mongodb';

interface Message {
  _id: ObjectId;
  content: string;
  sender: string;
  timestamp: Date;
}

interface Chat {
  _id: ObjectId;
  participants: string[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

type ChatWithoutId = Omit<Chat, '_id'>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized - Please sign in' });
    }

    const client = await clientPromise;
    const db = client.db();
    const chatsCollection = db.collection<Chat>('chats');

    // GET - Fetch chats for a user
    if (req.method === 'GET') {
      const { userId, recipientId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' });
      }

      // If recipientId is provided, find specific chat
      if (recipientId) {
        const chat = await chatsCollection.findOne({
          participants: {
            $all: [userId, recipientId]
          }
        });
        return res.status(200).json(chat || null);
      }

      // Otherwise, find all chats for the user
      const chats = await chatsCollection
        .find({
          participants: userId
        })
        .sort({ updatedAt: -1 })
        .toArray();

      return res.status(200).json(chats);
    }

    // POST - Create new chat or add message to existing chat
    if (req.method === 'POST') {
      const { participants, message } = req.body;

      if (!participants || !Array.isArray(participants) || participants.length !== 2) {
        return res.status(400).json({ message: 'Invalid participants' });
      }

      // Verify the current user is one of the participants
      if (!participants.includes(session.user.email)) {
        return res.status(403).json({ message: 'Unauthorized to create this chat' });
      }

      // Find existing chat or create new one
      let chat = await chatsCollection.findOne({
        participants: {
          $all: participants
        }
      });

      if (!chat) {
        // Create new chat
        const newChat: ChatWithoutId = {
          participants,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await chatsCollection.insertOne(newChat as any);
        chat = {
          _id: result.insertedId,
          ...newChat
        };
      }

      // If message is provided, add it to the chat
      if (message && chat) {
        const messageData: Message = {
          _id: new ObjectId(),
          content: message.content,
          sender: message.sender,
          timestamp: new Date()
        };

        await chatsCollection.updateOne(
          { _id: chat._id },
          { 
            $push: { messages: messageData as any },
            $set: { updatedAt: new Date() }
          }
        );

        chat.messages = [...(chat.messages || []), messageData];
      }

      return res.status(200).json(chat);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 