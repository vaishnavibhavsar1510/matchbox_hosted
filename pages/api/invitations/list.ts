import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { MongoClient, ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI as string);
    const db = client.db('matchbox');

    // Fetch invitations for the user
    const invitations = await db.collection('invitations')
      .aggregate([
        {
          $match: {
            'invitedUser.email': session.user.email
          }
        },
        {
          $lookup: {
            from: 'events',
            localField: 'eventId',
            foreignField: '_id',
            as: 'event'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'invitedBy.email',
            foreignField: 'email',
            as: 'host'
          }
        },
        {
          $unwind: '$event'
        },
        {
          $unwind: '$host'
        },
        {
          $project: {
            _id: 1,
            eventId: 1,
            eventName: '$event.title',
            hostId: '$invitedBy.email',
            hostName: '$invitedBy.name',
            status: 1,
            createdAt: 1
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]).toArray();

    await client.close();
    return res.status(200).json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 