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

    // Get user's invitations with populated event and host details
    const invitations = await db.collection('invitations')
      .aggregate([
        {
          $match: {
            'invitedEmail': session.user.email,
            'status': 'pending'
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
          $unwind: '$event'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'invitedBy',
            foreignField: '_id',
            as: 'inviter'
          }
        },
        {
          $unwind: '$inviter'
        },
        {
          $project: {
            _id: 1,
            eventId: 1,
            status: 1,
            event: {
              _id: 1,
              title: 1,
              date: 1,
              location: 1,
              capacity: 1,
              attendees: 1,
              status: 1,
              matchesRevealed: 1,
              host: {
                name: '$inviter.name',
                email: '$inviter.email'
              }
            },
            invitedBy: {
              name: '$inviter.name',
              email: '$inviter.email'
            }
          }
        }
      ]).toArray();

    return res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 