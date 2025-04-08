import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.query;
    const { status, notes } = req.body;

    if (!eventId || !status || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Create or update RSVP in the rsvps collection
    const rsvpData = {
      eventId: new ObjectId(eventId),
      userId: session.user.email,
      status,
      notes: notes || '',
      updatedAt: new Date(),
      __v: 0,
      createdAt: new Date() // This will be overwritten if the document already exists
    };

    // Try to update existing RSVP first
    const result = await db.collection('rsvps').updateOne(
      { 
        eventId: new ObjectId(eventId),
        userId: session.user.email
      },
      {
        $set: {
          status,
          notes: notes || '',
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date(),
          __v: 0
        }
      },
      { upsert: true }
    );

    // Get all RSVPs for this event
    const eventRsvps = await db.collection('rsvps')
      .find({ eventId: new ObjectId(eventId) })
      .toArray();

    // Format RSVPs as a map for the frontend
    const rsvpsMap = eventRsvps.reduce<Record<string, { status: string; notes: string; updatedAt: Date }>>((acc, rsvp) => {
      acc[rsvp.userId] = {
        status: rsvp.status,
        notes: rsvp.notes,
        updatedAt: rsvp.updatedAt
      };
      return acc;
    }, {});

    return res.status(200).json({ 
      message: 'RSVP updated successfully',
      rsvps: rsvpsMap
    });
  } catch (error) {
    console.error('RSVP Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 