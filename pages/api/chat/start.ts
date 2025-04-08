import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { IChat } from '@/models/Chat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID is required' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if a chat already exists between these users
    const existingChat = await db.collection('chats').findOne({
      participants: {
        $all: [session.user.email, matchId]
      }
    });

    if (existingChat) {
      return res.status(200).json({
        chatId: existingChat._id.toString(),
        participants: existingChat.participants,
        messages: existingChat.messages || []
      });
    }

    // Create a new chat
    const newChat: IChat = {
      participants: [session.user.email, matchId],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('chats').insertOne(newChat);

    return res.status(201).json({
      chatId: result.insertedId.toString(),
      participants: newChat.participants,
      messages: []
    });
  } catch (error) {
    console.error('Error starting chat:', error);
    return res.status(500).json({ error: 'Failed to start chat' });
  }
} 