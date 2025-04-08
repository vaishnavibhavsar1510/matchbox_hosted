import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized - Please sign in' });
    }

    const { id } = req.query;
    const { status } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid invitation ID' });
    }

    if (status !== 'accepted' && status !== 'declined') {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Find the invitation and check if it belongs to the user
    const invitation = await db.collection('invitations').findOne({
      _id: new ObjectId(id),
      'invitedUser.email': session.user.email,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already processed' });
    }

    // Start a session for the transaction
    const dbSession = client.startSession();

    try {
      await dbSession.withTransaction(async () => {
        // Update the invitation status
        await db.collection('invitations').updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              status,
              updatedAt: new Date()
            }
          },
          { session: dbSession }
        );

        if (status === 'accepted') {
          // Get user details
          const user = await db.collection('users').findOne(
            { email: session.user.email },
            { projection: { name: 1, email: 1 } }
          );

          if (!user) {
            throw new Error('User not found');
          }

          // Update the event's attendees list with user details
          const result = await db.collection('events').updateOne(
            {
              _id: new ObjectId(invitation.eventId),
              'attendees.email': { $ne: session.user.email }, // Make sure user isn't already in attendees
              $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] } // Check capacity
            },
            {
              $addToSet: { 
                attendees: {
                  email: session.user.email,
                  name: user.name,
                  joinedAt: new Date(),
                  status: 'going'
                }
              }
            },
            { session: dbSession }
          );

          if (result.modifiedCount === 0) {
            // Check if it failed because the event is full
            const event = await db.collection('events').findOne(
              { _id: new ObjectId(invitation.eventId) },
              { projection: { capacity: 1, attendees: 1 } }
            );

            if (event && event.attendees && event.attendees.length >= event.capacity) {
              throw new Error('Event is at full capacity');
            } else if (event && event.attendees.some((a: any) => a.email === session.user.email)) {
              throw new Error('You are already attending this event');
            }
          }
        }
      });

      await dbSession.endSession();

      // Return updated event data along with the success message
      const updatedEvent = await db.collection('events').findOne(
        { _id: new ObjectId(invitation.eventId) },
        { projection: { attendees: 1, capacity: 1 } }
      );

      return res.status(200).json({
        message: `Invitation ${status === 'accepted' ? 'accepted' : 'declined'} successfully`,
        event: updatedEvent
      });
    } catch (error) {
      await dbSession.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error processing invitation:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
} 