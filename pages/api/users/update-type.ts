import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { email, userType } = req.body;

    // Validate input
    if (!email || !userType || !['host', 'attendee'].includes(userType)) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Verify email matches session user
    if (email !== session.user.email) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const client = await clientPromise;
    const db = client.db('matchbox');

    // Update user type
    const result = await db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          userType,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User type updated successfully' });
  } catch (error) {
    console.error('Error updating user type:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 