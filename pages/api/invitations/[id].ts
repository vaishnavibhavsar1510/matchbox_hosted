import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    const { status } = req.body;

    if (!id || typeof id !== 'string' || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the invitation and check if it belongs to the user
    const invitation = await db.collection('invitations').findOne({
      _id: new ObjectId(id),
      invitedEmail: session.user.email,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Update invitation status
    await db.collection('invitations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    // If accepted, add user to event attendees
    if (status === 'accepted') {
      await db.collection('events').updateOne(
        { _id: new ObjectId(invitation.eventId) },
        { $addToSet: { attendees: session.user.email } }
      );
    }

    return res.status(200).json({ message: 'Invitation updated successfully' });
  } catch (error) {
    console.error('Error updating invitation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 