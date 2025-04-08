import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  calculateCompatibilityScore, 
  calculateAIMatchScore,
  UserProfile 
} from '../../../utils/matchingAlgorithms';

type MatchResponse = {
  matches: {
    user: UserProfile;
    score: number;
    aiScore?: number;
    compatibilityDetails?: {
      interestOverlap: string[];
      commonActivities: string[];
      locationDistance: number;
      relationshipGoalsMatch: boolean;
    };
  }[];
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
  // Add more mock users as needed
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MatchResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ matches: [], error: 'Method not allowed' });
  }

  try {
    const userProfile: UserProfile = req.body;

    // Validate required fields
    if (!userProfile || !userProfile.id || !userProfile.interests) {
      return res.status(400).json({
        matches: [],
        error: 'Invalid user profile data'
      });
    }

    // Find potential matches (excluding the user themselves)
    const potentialMatches = mockUsers.filter(user => user.id !== userProfile.id);

    // Calculate compatibility scores for all potential matches
    const matchPromises = potentialMatches.map(async (match) => {
      // Calculate basic compatibility score
      const compatibilityScore = calculateCompatibilityScore(
        userProfile,
        match,
        10 // Mock distance in miles - in production, calculate actual distance
      );

      // If basic compatibility is above threshold, calculate AI score
      if (compatibilityScore > 0.5) {
        const aiScore = await calculateAIMatchScore(userProfile, match);
        
        // Calculate detailed compatibility information
        const commonInterests = userProfile.interests.filter(interest =>
          match.interests.includes(interest)
        );

        return {
          user: match,
          score: compatibilityScore,
          aiScore,
          compatibilityDetails: {
            interestOverlap: commonInterests,
            commonActivities: [], // In production, calculate actual common activities
            locationDistance: 10, // Mock distance - replace with actual calculation
            relationshipGoalsMatch: userProfile.relationshipGoals === match.relationshipGoals
          }
        };
      }

      return null;
    });

    // Wait for all match calculations to complete
    const matches = (await Promise.all(matchPromises))
      .filter(match => match !== null) // Remove null matches
      .sort((a, b) => (b?.aiScore || 0) - (a?.aiScore || 0)) // Sort by AI score
      .slice(0, 10); // Limit to top 10 matches

    return res.status(200).json({ matches: matches as MatchResponse['matches'] });
  } catch (error) {
    console.error('Error finding matches:', error);
    return res.status(500).json({
      matches: [],
      error: 'Internal server error while finding matches'
    });
  }
} 