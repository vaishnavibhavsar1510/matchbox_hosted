import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized - Please sign in' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user is a host
    const user = await db.collection('users').findOne(
      { email: session.user.email },
      { projection: { userType: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.userType !== 'host') {
      return res.status(403).json({ message: 'Only hosts can view hosted events' });
    }

    // Get all events hosted by the user
    const events = await db.collection('events')
      .aggregate([
        {
          $match: {
            hostId: session.user.email
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'attendees',
            foreignField: 'email',
            as: 'attendeeDetails'
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            date: 1,
            location: 1,
            capacity: 1,
            interests: 1,
            isPrivate: 1,
            attendees: 1,
            rsvps: 1,
            status: 1,
            matchesRevealed: 1,
            createdAt: 1,
            updatedAt: 1,
            attendeeDetails: {
              $map: {
                input: '$attendeeDetails',
                as: 'attendee',
                in: {
                  name: '$$attendee.name',
                  email: '$$attendee.email',
                  interests: '$$attendee.interests'
                }
              }
            }
          }
        },
        {
          $sort: { date: 1 }
        }
      ]).toArray();

    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching hosted events:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 