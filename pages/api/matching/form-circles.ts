import type { NextApiRequest, NextApiResponse } from 'next';
import { formMatchCircles, UserProfile } from '../../../utils/matchingAlgorithms';

type CircleResponse = {
  circles: UserProfile[][];
  error?: string;
};

// Mock database of users (replace with actual database in production)
const mockUsers: UserProfile[] = [
  {
    id: '1',
    interests: ['Photography', 'Travel', 'Cooking'],
    personalityType: 'Outgoing & Social',
    activityLevel: 'Active',
    dealBreakers: ['Smoking'],
    mustHaves: ['Non-smoker'],
    ageRange: { min: 25, max: 35 },
    locationPreference: 25,
    socialStyle: 'Small group activities',
    relationshipGoals: 'Long-term relationship'
  },
  {
    id: '2',
    interests: ['Music', 'Travel', 'Technology'],
    personalityType: 'Creative & Artistic',
    activityLevel: 'Moderate',
    dealBreakers: ['Heavy drinking'],
    mustHaves: ['Similar interests'],
    ageRange: { min: 23, max: 33 },
    locationPreference: 15,
    socialStyle: 'Small group activities',
    relationshipGoals: 'Long-term relationship'
  },
  {
    id: '3',
    interests: ['Sports', 'Fitness', 'Outdoor Activities'],
    personalityType: 'Outgoing & Social',
    activityLevel: 'Very Active',
    dealBreakers: ['Smoking', 'Inactive lifestyle'],
    mustHaves: ['Active lifestyle'],
    ageRange: { min: 25, max: 35 },
    locationPreference: 20,
    socialStyle: 'Mix of different settings',
    relationshipGoals: 'Long-term relationship'
  },
  {
    id: '4',
    interests: ['Reading', 'Art', 'Museums'],
    personalityType: 'Reserved & Thoughtful',
    activityLevel: 'Relaxed',
    dealBreakers: [],
    mustHaves: ['Intellectual conversations'],
    ageRange: { min: 27, max: 40 },
    locationPreference: 30,
    socialStyle: 'One-on-one interactions',
    relationshipGoals: 'Let\'s see what happens'
  },
  {
    id: '5',
    interests: ['Technology', 'Gaming', 'Movies'],
    personalityType: 'Reserved & Thoughtful',
    activityLevel: 'Moderate',
    dealBreakers: ['Smoking'],
    mustHaves: ['Similar interests'],
    ageRange: { min: 21, max: 35 },
    locationPreference: 25,
    socialStyle: 'Small group activities',
    relationshipGoals: 'Making new friends'
  },
  {
    id: '6',
    interests: ['Travel', 'Languages', 'Culture'],
    personalityType: 'Adventurous & Spontaneous',
    activityLevel: 'Active',
    dealBreakers: ['Different life goals'],
    mustHaves: ['Wants to travel'],
    ageRange: { min: 25, max: 38 },
    locationPreference: 50,
    socialStyle: 'Mix of different settings',
    relationshipGoals: 'Long-term relationship'
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CircleResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ circles: [], error: 'Method not allowed' });
  }

  try {
    const { circleSize = 6 } = req.body;

    // Validate circle size
    if (circleSize < 3 || circleSize > 8) {
      return res.status(400).json({
        circles: [],
        error: 'Circle size must be between 3 and 8'
      });
    }

    // Form match circles using our algorithm
    const circles = formMatchCircles(mockUsers, circleSize);

    // Return the formed circles
    return res.status(200).json({ circles });
  } catch (error) {
    console.error('Error forming circles:', error);
    return res.status(500).json({
      circles: [],
      error: 'Internal server error while forming circles'
    });
  }
} 