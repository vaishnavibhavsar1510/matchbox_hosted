import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Match } from '../types/match';
import { useRouter } from 'next/router';

interface MatchesContextType {
  matches: Match[];
  loading: boolean;
  error: string | null;
  updateMatchStatus: (matchId: string, status: 'accepted' | 'declined') => Promise<void>;
}

const MatchesContext = createContext<MatchesContextType | undefined>(undefined);

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/matches');
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        setMatches(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [session?.user?.email]);

  const updateMatchStatus = async (matchId: string, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update match status');
      }

      const updatedMatch = await response.json();
      
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match._id === matchId ? { ...match, status } : match
        )
      );

      return updatedMatch;
    } catch (err) {
      console.error('Error updating match status:', err);
      throw err;
    }
  };

  const startChat = async (userId: string) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const chat = await response.json();
      router.push(`/dashboard/chat/${chat._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return (
    <MatchesContext.Provider value={{ matches, loading, error, updateMatchStatus }}>
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchesContext);
  if (context === undefined) {
    throw new Error('useMatches must be used within a MatchesProvider');
  }
  return context;
} 