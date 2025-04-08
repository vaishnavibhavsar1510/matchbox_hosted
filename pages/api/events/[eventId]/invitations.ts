import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized - Please sign in' });
    }

    const { eventId } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const client = await clientPromise;
    const db = client.db();

    // First check if the user is the host of the event
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId),
      hostId: session.user.email
    });

    if (!event) {
      return res.status(403).json({ message: 'You are not authorized to view invitations for this event' });
    }

    // Get all invitations for this event
    const invitations = await db.collection('invitations')
      .aggregate([
        {
          $match: {
            eventId: new ObjectId(eventId)
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { userEmail: '$invitedUser.email' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$email', '$$userEmail'] }
                }
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1
                }
              }
            ],
            as: 'userDetails'
          }
        },
        {
          $addFields: {
            invitedUser: {
              $mergeObjects: [
                '$invitedUser',
                { _id: { $arrayElemAt: ['$userDetails._id', 0] } }
              ]
            }
          }
        },
        {
          $project: {
            _id: 1,
            eventId: 1,
            invitedUser: 1,
            status: 1,
            createdAt: 1,
            userDetails: 0
          }
        }
      ]).toArray();

    return res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching event invitations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 