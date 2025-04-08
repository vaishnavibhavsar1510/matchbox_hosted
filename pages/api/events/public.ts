import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch all public events that are upcoming
    const events = await db.collection('events')
      .find({
        date: { $gte: new Date().toISOString() }, // Only future events
        isPrivate: { $ne: true } // Only public events
      })
      .sort({ date: 1 }) // Sort by date ascending
      .toArray();

    // Ensure each event has the required arrays initialized
    const sanitizedEvents = events.map(event => ({
      ...event,
      attendees: event.attendees || [],
      rsvps: event.rsvps || {}
    }));

    return res.status(200).json(sanitizedEvents);
  } catch (error) {
    console.error('Error fetching public events:', error);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
} 