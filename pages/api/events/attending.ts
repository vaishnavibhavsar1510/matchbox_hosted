import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get events where the user is an attendee
    const events = await db.collection('events')
      .aggregate([
        {
          $match: {
            attendees: session.user.email
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'hostId',
            foreignField: '_id',
            as: 'hostUser'
          }
        },
        {
          $unwind: '$hostUser'
        },
        {
          $addFields: {
            status: {
              $cond: {
                if: { $gt: ['$date', new Date()] },
                then: 'upcoming',
                else: {
                  $cond: {
                    if: '$matchesRevealed',
                    then: 'completed',
                    else: 'ongoing'
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            date: 1,
            location: 1,
            capacity: 1,
            attendees: 1,
            status: 1,
            matchesRevealed: 1,
            host: {
              name: '$hostUser.name',
              email: '$hostUser.email'
            }
          }
        },
        {
          $sort: {
            date: 1
          }
        }
      ]).toArray();

    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching attending events:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 