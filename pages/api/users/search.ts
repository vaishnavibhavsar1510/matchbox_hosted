import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db('matchbox');

    // Get all users except the current user
    const users = await db.collection('users')
      .find({
        email: { $ne: session.user.email } // Exclude current user
      })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        image: 1,
        interests: 1
      })
      .sort({ name: 1 }) // Sort by name alphabetically
      .toArray();

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ message: 'Failed to search users' });
  }
} 