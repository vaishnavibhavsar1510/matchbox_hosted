import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const client = await clientPromise;
  const db = client.db();

  if (req.method === 'GET') {
    try {
      console.log('Fetching chats for user:', session.user.email);
      
      // Find all chats where the current user is a participant
      const chats = await db.collection('chats')
        .aggregate([
          {
            $match: {
              participants: { $elemMatch: { email: session.user.email } }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'participants.email',
              foreignField: 'email',
              as: 'participantDetails'
            }
          },
          {
            $lookup: {
              from: 'messages',
              let: { chatId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$chatId', '$$chatId'] }
                  }
                },
                {
                  $sort: { timestamp: -1 }
                },
                {
                  $limit: 1
                }
              ],
              as: 'lastMessage'
            }
          },
          {
            $project: {
              id: { $toString: '$_id' },
              participants: {
                $map: {
                  input: '$participantDetails',
                  as: 'participant',
                  in: {
                    _id: { $toString: '$$participant._id' },
                    name: '$$participant.name',
                    email: '$$participant.email',
                    profileImage: '$$participant.profileImage'
                  }
                }
              },
              lastMessage: {
                $cond: {
                  if: { $gt: [{ $size: '$lastMessage' }, 0] },
                  then: {
                    id: { $toString: { $arrayElemAt: ['$lastMessage._id', 0] } },
                    content: { $arrayElemAt: ['$lastMessage.content', 0] },
                    sender: { $arrayElemAt: ['$lastMessage.sender', 0] },
                    timestamp: { $arrayElemAt: ['$lastMessage.timestamp', 0] }
                  },
                  else: null
                }
              },
              createdAt: '$createdAt',
              updatedAt: '$updatedAt'
            }
          },
          {
            $sort: {
              'lastMessage.timestamp': -1,
              createdAt: -1
            }
          }
        ]).toArray();

      console.log('Found chats:', chats);
      return res.json(chats);
    } catch (error) {
      console.error('Database Error:', error);
      return res.status(500).json({ 
        error: 'Error fetching chats',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 