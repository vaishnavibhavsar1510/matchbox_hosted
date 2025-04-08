import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized - Please sign in' });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if user exists and get their type
    const user = await db.collection('users').findOne(
      { email: session.user.email },
      { projection: { userType: 1 } }
    );
    console.log('User:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.method === 'POST') {
      if (user.userType !== 'host') {
        return res.status(403).json({ message: 'Only hosts can create events' });
      }

      const {
        title,
        description,
        datetime,
        location,
        capacity,
        interests,
        isPrivate
      } = req.body;

      console.log('Received event data:', req.body);

      // Validate required fields
      if (!title || !description || !datetime || !location || !capacity) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const event = {
        title,
        description,
        date: new Date(datetime),
        location,
        capacity: parseInt(capacity),
        interests: interests || [],
        isPrivate: Boolean(isPrivate),
        hostId: session.user.email,
        hostName: session.user.name,
        attendees: [session.user.email],
        rsvps: {
          [session.user.email]: {
            status: 'going',
            updatedAt: new Date()
          }
        },
        status: 'upcoming',
        matchesRevealed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating event:', event);

      const result = await db.collection('events').insertOne(event);
      console.log('Event created with ID:', result.insertedId);

      const createdEvent = {
        ...event,
        _id: result.insertedId,
        host: {
          name: session.user.name,
          email: session.user.email
        },
        status: 'upcoming'
      };

      console.log('Returning created event:', createdEvent);

      return res.status(201).json({
        message: 'Event created successfully',
        eventId: result.insertedId,
        event: createdEvent
      });
    }

    if (req.method === 'GET') {
      const events = await db.collection('events')
        .aggregate([
          {
            $match: {
              $or: [
                { isPrivate: false },
                { hostId: session.user.email },
                { attendees: session.user.email }
              ]
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'hostId',
              foreignField: 'email',
              as: 'hostDetails'
            }
          },
          {
            $lookup: {
              from: 'rsvps',
              let: { eventId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$eventId', '$$eventId'] }
                  }
                }
              ],
              as: 'rsvpDetails'
            }
          },
          {
            $unwind: '$hostDetails'
          },
          {
            $addFields: {
              rsvps: {
                $reduce: {
                  input: '$rsvpDetails',
                  initialValue: {},
                  in: {
                    $mergeObjects: [
                      '$$value',
                      {
                        $arrayToObject: [[
                          {
                            k: '$$this.userId',
                            v: {
                              status: '$$this.status',
                              notes: '$$this.notes',
                              updatedAt: '$$this.updatedAt'
                            }
                          }
                        ]]
                      }
                    ]
                  }
                }
              }
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
              host: {
                name: '$hostDetails.name',
                email: '$hostDetails.email'
              }
            }
          },
          {
            $sort: { date: 1 }
          }
        ]).toArray();

      return res.status(200).json(events);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 