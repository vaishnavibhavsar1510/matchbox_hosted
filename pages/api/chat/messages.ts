import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { IMessage } from '@/models/Chat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await clientPromise;
  const db = client.db();

  if (req.method === 'GET') {
    try {
      const { chatId } = req.query;
      if (!chatId || typeof chatId !== 'string') {
        return res.status(400).json({ error: 'Chat ID is required' });
      }

      const chat = await db.collection('chats').findOne({
        _id: new ObjectId(chatId),
        participants: session.user.email
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      return res.status(200).json({ messages: chat.messages || [] });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { chatId, message } = req.body;
      if (!chatId || !message?.content) {
        return res.status(400).json({ error: 'Chat ID and message content are required' });
      }

      const newMessage: IMessage = {
        sender: session.user.email,
        content: message.content,
        timestamp: new Date().toISOString()
      };

      const result = await db.collection('chats').updateOne(
        {
          _id: new ObjectId(chatId),
          participants: session.user.email
        },
        {
          $push: { messages: newMessage },
          $set: { updatedAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      return res.status(200).json({ message: newMessage });
    } catch (error) {
      console.error('Error saving message:', error);
      return res.status(500).json({ error: 'Failed to save message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 