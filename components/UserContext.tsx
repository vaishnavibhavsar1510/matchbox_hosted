import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserData {
  _id?: string;
  email: string;
  name: string;
  birthdate: string;
  gender: string;
  interests: string[];
  personality: string;
  activityLevel: string;
  socialStyle: string;
  relationshipGoals: string;
  location: string;
  bio: string;
  profileImage?: string;
  // Host-specific fields
  companyName?: string;
  eventTypes?: string[];
  experience?: string;
  capacity?: string;
  venueTypes?: string[];
  userType?: 'host' | 'attendee';
  // Preference fields
  looking_for?: string;
  age_range?: {
    min: number;
    max: number;
  };
  location_preference?: string;
  must_haves?: string[];
  dealbreakers?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserContextType {
  userData: UserData | null;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'loading') {
        return;
      }

      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setUserData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [session, status]);

  const updateUserData = async (data: Partial<UserData>) => {
    if (!session?.user?.email) {
      console.error('No session found when trying to update user data');
      throw new Error('Not authenticated');
    }

    try {
      setIsLoading(true);
      console.log('Sending update request with data:', data);
      
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Server responded with error:', responseData);
        throw new Error(responseData.error || 'Failed to update user data');
      }

      console.log('Successfully received updated user data:', responseData);
      setUserData(responseData);
      setError(null);
      return responseData;
    } catch (err) {
      console.error('Error in updateUserData:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user data';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ userData, updateUserData, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 