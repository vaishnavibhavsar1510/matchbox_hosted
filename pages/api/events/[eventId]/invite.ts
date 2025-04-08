import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { eventId } = req.query;
    const { userEmails, message } = req.body;

    if (!Array.isArray(userEmails) || userEmails.length === 0) {
      return res.status(400).json({ message: 'No users selected for invitation' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify the event exists and the user is the host
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId as string),
      hostId: session.user.email
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or you are not the host' });
    }

    // Create chat rooms for each invited user
    const chatRooms = await Promise.all(userEmails.map(async (email) => {
      const chatRoom = {
        eventId: event._id,
        participants: [session.user.email, email],
        messages: [{
          sender: session.user.email,
          content: message || `You've been invited to ${event.title}!`,
          timestamp: new Date(),
          type: 'invitation'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('chats').insertOne(chatRoom);
      return {
        chatId: result.insertedId,
        invitedEmail: email
      };
    }));

    // Update event with invitations
    const updateResult = await db.collection('events').updateOne(
      { _id: new ObjectId(eventId as string) },
      {
        $addToSet: {
          'rsvps.invitedEmails': { $each: userEmails }
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Create notifications for invited users
    const notifications = userEmails.map(email => ({
      userId: email,
      type: 'event_invitation',
      eventId: event._id,
      hostId: session.user.email,
      message: `You've been invited to ${event.title}`,
      read: false,
      createdAt: new Date()
    }));

    await db.collection('notifications').insertMany(notifications);

    return res.status(200).json({
      message: 'Invitations sent successfully',
      chatRooms
    });

  } catch (error) {
    console.error('Error sending invitations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 