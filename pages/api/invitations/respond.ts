import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { invitationId, status } = req.body;

    if (!invitationId || !status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db('matchbox');

    // Get user ID from email
    const user = await db.collection('users').findOne({ email: session.user.email });
    if (!user) {
      await client.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Find and update the invitation
    const invitation = await db.collection('invitations').findOne({
      _id: new ObjectId(invitationId),
      attendeeId: new ObjectId(user._id)
    });

    if (!invitation) {
      await client.close();
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      await client.close();
      return res.status(400).json({ error: 'Invitation has already been responded to' });
    }

    // Update invitation status
    await db.collection('invitations').updateOne(
      { _id: new ObjectId(invitationId) },
      { $set: { status, respondedAt: new Date() } }
    );

    // If accepted, add user to event attendees
    if (status === 'accepted') {
      await db.collection('events').updateOne(
        { _id: invitation.eventId },
        { 
          $addToSet: { 
            attendees: {
              userId: new ObjectId(user._id),
              name: user.name,
              email: user.email,
              joinedAt: new Date()
            }
          }
        }
      );
    }

    await client.close();
    return res.status(200).json({ message: 'Invitation updated successfully' });
  } catch (error) {
    console.error('Error updating invitation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 