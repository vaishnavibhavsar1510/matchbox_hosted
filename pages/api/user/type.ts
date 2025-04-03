import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized - Please sign in' });
    }

    const client = await clientPromise;
    const db = client.db();

    if (req.method === 'GET') {
      const user = await db.collection('users').findOne(
        { email: session.user.email },
        { projection: { userType: 1 } }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ userType: user.userType || null });
    }

    if (req.method === 'POST') {
      const { userType } = req.body;

      if (!userType || !['host', 'attendee'].includes(userType)) {
        return res.status(400).json({ message: 'Invalid user type' });
      }

      const result = await db.collection('users').updateOne(
        { email: session.user.email },
        {
          $set: {
            userType,
            updatedAt: new Date()
          }
        },
        { upsert: false }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ message: 'User type updated successfully', userType });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in user type API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 