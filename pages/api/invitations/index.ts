import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized - Please sign in' });
    }

    const client = await clientPromise;
    const db = client.db();

    // GET method - Fetch invitations for the user
    if (req.method === 'GET') {
      const invitations = await db.collection('invitations')
        .aggregate([
          {
            $match: {
              'invitedUser.email': session.user.email
            }
          },
          // Sort by createdAt in descending order to get the latest invitation first
          {
            $sort: { createdAt: -1 }
          },
          // Group by eventId to get unique events
          {
            $group: {
              _id: '$eventId',
              // Keep the first (latest) document for each eventId
              invitation: { $first: '$$ROOT' }
            }
          },
          // Replace the root with the invitation document
          {
            $replaceRoot: { newRoot: '$invitation' }
          },
          {
            $lookup: {
              from: 'events',
              let: { eventId: '$eventId' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$_id', '$$eventId'] }
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    let: { hostId: '$hostId' },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ['$email', '$$hostId'] }
                        }
                      },
                      {
                        $project: {
                          _id: 0,
                          name: 1,
                          email: 1
                        }
                      }
                    ],
                    as: 'hostDetails'
                  }
                },
                {
                  $addFields: {
                    host: { $arrayElemAt: ['$hostDetails', 0] }
                  }
                },
                {
                  $project: {
                    hostDetails: 0
                  }
                }
              ],
              as: 'event'
            }
          },
          {
            $unwind: '$event'
          },
          {
            $project: {
              _id: 1,
              eventId: 1,
              event: 1,
              status: 1,
              invitedBy: 1,
              createdAt: 1,
              updatedAt: 1,
              invitedUser: 1
            }
          }
        ]).toArray();

      return res.status(200).json(invitations);
    }

    // POST method - Create new invitation
    if (req.method === 'POST') {
      const { eventId, invitedUser } = req.body;

      if (!eventId || !invitedUser?.email) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if the user is the host of the event
      const event = await db.collection('events').findOne({
        _id: new ObjectId(eventId),
        hostId: session.user.email
      });

      if (!event) {
        return res.status(403).json({ message: 'You are not authorized to invite users to this event' });
      }

      // Check if the user is already invited or attending
      const existingInvitation = await db.collection('invitations').findOne({
        eventId: new ObjectId(eventId),
        'invitedUser.email': invitedUser.email
      });

      if (existingInvitation) {
        return res.status(400).json({ message: 'User has already been invited to this event' });
      }

      const isAttending = event.attendees.includes(invitedUser.email);
      if (isAttending) {
        return res.status(400).json({ message: 'User is already attending this event' });
      }

      // Create the invitation
      const invitation = {
        eventId: new ObjectId(eventId),
        invitedUser: {
          email: invitedUser.email,
          name: invitedUser.name
        },
        invitedBy: {
          email: session.user.email,
          name: session.user.name
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('invitations').insertOne(invitation);

      return res.status(201).json({
        message: 'Invitation sent successfully',
        invitationId: result.insertedId
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in invitations API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 