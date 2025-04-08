import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'PUT', 'DELETE'].includes(req.method || '')) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.query;
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const event = await db.collection('events').findOne(
        { _id: new ObjectId(eventId) },
        { projection: { password: 0 } }
      );

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      return res.status(200).json(event);
    }

    if (req.method === 'PUT') {
      const { title, description, date, location, maxAttendees } = req.body;
      
      if (!title || !description || !date || !location || !maxAttendees) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await db.collection('events').updateOne(
        { _id: new ObjectId(eventId), createdBy: session.user.email },
        {
          $set: {
            title,
            description,
            date,
            location,
            maxAttendees,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Event not found or unauthorized' });
      }

      return res.status(200).json({ message: 'Event updated successfully' });
    }

    if (req.method === 'DELETE') {
      const result = await db.collection('events').deleteOne({
        _id: new ObjectId(eventId),
        createdBy: session.user.email,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Event not found or unauthorized' });
      }

      return res.status(200).json({ message: 'Event deleted successfully' });
    }
  } catch (error) {
    console.error('Event API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 