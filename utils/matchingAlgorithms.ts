export interface UserProfile {
  id: string;
  interests: string[];
  personalityType: string;
  activityLevel: string;
  dealBreakers: string[];
  mustHaves: string[];
  ageRange: { min: number; max: number };
  locationPreference: number; // in miles
  socialStyle: string;
  relationshipGoals: string;
}

// 1. Cosine Similarity Algorithm
export function calculateCosineSimilarity(user1: UserProfile, user2: UserProfile): number {
  // Convert interests into binary vectors
  const allInterests = Array.from(new Set([...user1.interests, ...user2.interests]));
  const vector1 = allInterests.map(interest => user1.interests.includes(interest) ? 1 : 0);
  const vector2 = allInterests.map(interest => user2.interests.includes(interest) ? 1 : 0);

  // Calculate dot product
  const dotProduct = vector1.reduce<number>((acc, val, i) => acc + val * vector2[i], 0);

  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.reduce<number>((acc, val) => acc + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce<number>((acc, val) => acc + val * val, 0));

  // Return cosine similarity
  return dotProduct / (magnitude1 * magnitude2);
}

// 2. Weighted Interest Matching
export function calculateWeightedMatch(user1: UserProfile, user2: UserProfile): number {
  let score = 0;
  const weights = {
    interests: 0.3,
    personalityType: 0.15,
    activityLevel: 0.15,
    socialStyle: 0.15,
    relationshipGoals: 0.25
  };

  // Calculate interest overlap
  const commonInterests = user1.interests.filter(interest => 
    user2.interests.includes(interest)
  ).length;
  const interestScore = commonInterests / Math.max(user1.interests.length, user2.interests.length);
  score += interestScore * weights.interests;

  // Personality type compatibility
  score += (user1.personalityType === user2.personalityType ? 1 : 0.5) * weights.personalityType;

  // Activity level compatibility
  score += (user1.activityLevel === user2.activityLevel ? 1 : 0.5) * weights.activityLevel;

  // Social style compatibility
  score += (user1.socialStyle === user2.socialStyle ? 1 : 0.5) * weights.socialStyle;

  // Relationship goals alignment
  score += (user1.relationshipGoals === user2.relationshipGoals ? 1 : 0) * weights.relationshipGoals;

  return score;
}

// 3. Dealbreaker Filter
export function checkDealbreakers(user1: UserProfile, user2: UserProfile): boolean {
  // Check if any of user2's attributes are in user1's dealbreakers
  const hasNoConflicts = user1.dealBreakers.every(dealbreaker => 
    !user2.mustHaves.includes(dealbreaker)
  );

  // Check if all must-haves are satisfied
  const mustHavesSatisfied = user1.mustHaves.every(mustHave => 
    user2.mustHaves.includes(mustHave)
  );

  return hasNoConflicts && mustHavesSatisfied;
}

// 4. Compatibility Score with Geographic Distance Penalty
export function calculateCompatibilityScore(user1: UserProfile, user2: UserProfile, distance: number): number {
  // Only proceed if dealbreakers don't disqualify the match
  if (!checkDealbreakers(user1, user2)) {
    return 0;
  }

  // Calculate base compatibility using weighted match
  let baseScore = calculateWeightedMatch(user1, user2);

  // Apply distance penalty
  const distancePenalty = Math.max(0, 1 - (distance / user1.locationPreference));
  baseScore *= distancePenalty;

  return baseScore;
}

// 5. AI-Enhanced Matching Algorithm
export async function calculateAIMatchScore(user1: UserProfile, user2: UserProfile): Promise<number> {
  // Base compatibility score
  const baseScore = calculateCompatibilityScore(user1, user2, 0); // Assuming distance is handled separately

  // Additional factors for AI consideration
  const factors = {
    interestSynergy: calculateInterestSynergy(user1, user2),
    activityCompatibility: calculateActivityCompatibility(user1, user2),
    socialStyleMatch: calculateSocialStyleMatch(user1, user2),
    longTermCompatibility: predictLongTermCompatibility(user1, user2)
  };

  // Weighted combination of all factors
  const aiScore = (
    baseScore * 0.4 +
    factors.interestSynergy * 0.2 +
    factors.activityCompatibility * 0.15 +
    factors.socialStyleMatch * 0.15 +
    factors.longTermCompatibility * 0.1
  );

  return aiScore;
}

// Helper functions for AI-Enhanced Matching
function calculateInterestSynergy(user1: UserProfile, user2: UserProfile): number {
  // Calculate how well interests complement each other
  const commonInterests = user1.interests.filter(i => user2.interests.includes(i));
  const uniqueInterests = user1.interests.filter(i => !user2.interests.includes(i));
  
  return (commonInterests.length * 0.7 + uniqueInterests.length * 0.3) / 
         Math.max(user1.interests.length, user2.interests.length);
}

function calculateActivityCompatibility(user1: UserProfile, user2: UserProfile): number {
  const activityLevels = ['Very Active', 'Active', 'Moderate', 'Relaxed'];
  const level1 = activityLevels.indexOf(user1.activityLevel);
  const level2 = activityLevels.indexOf(user2.activityLevel);
  
  return 1 - Math.abs(level1 - level2) / (activityLevels.length - 1);
}

function calculateSocialStyleMatch(user1: UserProfile, user2: UserProfile): number {
  const styles = ['Large social gatherings', 'Small group activities', 'One-on-one interactions', 'Mix of different settings'];
  return user1.socialStyle === user2.socialStyle ? 1 :
         Math.abs(styles.indexOf(user1.socialStyle) - styles.indexOf(user2.socialStyle)) === 1 ? 0.7 : 0.4;
}

function predictLongTermCompatibility(user1: UserProfile, user2: UserProfile): number {
  // Predict long-term compatibility based on relationship goals and must-haves
  const sameGoals = user1.relationshipGoals === user2.relationshipGoals;
  const sharedMustHaves = user1.mustHaves.filter(m => user2.mustHaves.includes(m)).length;
  const maxMustHaves = Math.max(user1.mustHaves.length, user2.mustHaves.length);
  
  return sameGoals ? (0.7 + 0.3 * (sharedMustHaves / maxMustHaves)) : (0.3 * (sharedMustHaves / maxMustHaves));
}

// 6. Match Circle Formation Algorithm
export function formMatchCircles(users: UserProfile[], circleSize: number = 6): UserProfile[][] {
  const circles: UserProfile[][] = [];
  const usedUsers = new Set<string>();

  // For each user that hasn't been placed in a circle
  for (const user of users) {
    if (usedUsers.has(user.id)) continue;

    // Find best matches for this user
    const matches = users
      .filter(potentialMatch => 
        !usedUsers.has(potentialMatch.id) && 
        potentialMatch.id !== user.id &&
        checkDealbreakers(user, potentialMatch)
      )
      .map(match => ({
        user: match,
        score: calculateCompatibilityScore(user, match, 0) // Assuming distance is handled separately
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, circleSize - 1)
      .map(match => match.user);

    if (matches.length >= circleSize - 1) {
      const circle = [user, ...matches];
      circles.push(circle);
      circle.forEach(u => usedUsers.add(u.id));
    }
  }

  return circles;
} 