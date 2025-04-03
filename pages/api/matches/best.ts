import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For now, return a mock best match
    // TODO: Implement actual matching logic
    return res.status(200).json({
      name: 'Neha',
      matchPercentage: 100,
      sharedInterests: [
        'Art & Culture',
        'Sports & Fitness',
        'Travel & Adventure',
        'Food & Cooking'
      ]
    });
  } catch (error) {
    console.error('Error fetching best match:', error);
    return res.status(500).json({ error: 'Failed to fetch best match' });
  }
} 