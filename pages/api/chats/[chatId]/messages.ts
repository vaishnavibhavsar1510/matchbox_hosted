import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { chatId } = req.query;
  if (!chatId || typeof chatId !== 'string') {
    return res.status(400).json({ error: 'Invalid chat ID' });
  }

  const client = await clientPromise;
  const db = client.db();

  // Verify the user is a participant in this chat
  const chat = await db.collection('chats').findOne({
    _id: new ObjectId(chatId),
    participants: { $elemMatch: { email: session.user.email } }
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  if (req.method === 'GET') {
    try {
      const messages = await db.collection('messages')
        .find({ chatId: new ObjectId(chatId) })
        .sort({ timestamp: 1 })
        .toArray();

      // Mark messages as read
      await db.collection('messages').updateMany(
        {
          chatId: new ObjectId(chatId),
          'sender.email': { $ne: session.user.email },
          read: false
        },
        {
          $set: { read: true }
        }
      );

      return res.json(messages.map(message => ({
        id: message._id.toString(),
        content: message.content,
        sender: message.sender,
        timestamp: message.timestamp,
        read: message.read
      })));
    } catch (error) {
      console.error('Database Error:', error);
      return res.status(500).json({ error: 'Error fetching messages' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid message content' });
      }

      const message = {
        chatId: new ObjectId(chatId),
        content,
        sender: {
          email: session.user.email,
          name: session.user.name
        },
        timestamp: new Date().toISOString(),
        read: false
      };

      const result = await db.collection('messages').insertOne(message);

      // Update the chat's lastMessage and updatedAt
      await db.collection('chats').updateOne(
        { _id: new ObjectId(chatId) },
        {
          $set: {
            lastMessage: {
              _id: result.insertedId,
              content,
              sender: message.sender,
              timestamp: message.timestamp
            },
            updatedAt: new Date().toISOString()
          }
        }
      );

      return res.json({
        id: result.insertedId.toString(),
        content,
        sender: message.sender,
        timestamp: message.timestamp,
        read: false
      });
    } catch (error) {
      console.error('Database Error:', error);
      return res.status(500).json({ error: 'Error sending message' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 