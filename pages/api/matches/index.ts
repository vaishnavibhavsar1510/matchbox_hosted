import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const client = await clientPromise;
    const db = client.db("matchbox");
    const users = db.collection("users");

    const { email } = req.query;
    const currentUser = await users.findOne({ email });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure interests is an array and not empty
    const currentUserInterests = Array.isArray(currentUser.interests) && currentUser.interests.length > 0 
      ? currentUser.interests 
      : [];
    
    // Debug logging
    console.log('Current user:', {
      email: currentUser.email,
      interests: currentUserInterests,
      interestsLength: currentUserInterests.length
    });

    if (currentUserInterests.length === 0) {
      console.log('No interests found for current user');
      return res.status(200).json([]);
    }

    // Find users with shared interests
    const matches = await users.aggregate([
      {
        $match: {
          email: { $ne: email }, // Exclude current user
          interests: { $in: currentUserInterests }, // Match users with shared interests
        },
      },
      {
        $addFields: {
          sharedInterests: {
            $size: {
              $setIntersection: ['$interests', currentUserInterests],
            },
          },
        },
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          name: 1,
          email: 1,
          interests: 1,
          sharedInterests: 1,
          bio: 1,
          profileImage: 1,
          compatibilityScore: {
            $multiply: [
              { $divide: ['$sharedInterests', currentUserInterests.length] },
              100,
            ],
          },
        },
      },
      {
        $sort: { compatibilityScore: -1 },
      },
      {
        $limit: 1 // Only return the best match
      }
    ]).toArray();

    // Log the match for debugging
    console.log('Current user interests:', currentUserInterests);
    console.log('Best match:', matches[0] ? {
      name: matches[0].name,
      email: matches[0].email,
      sharedInterests: matches[0].sharedInterests,
      compatibilityScore: matches[0].compatibilityScore,
      interests: matches[0].interests
    } : 'No match found');

    res.status(200).json(matches);
  } catch (error) {
    console.error('Error finding matches:', error);
    res.status(500).json({ error: 'Error finding matches' });
  }
} 