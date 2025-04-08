import { useState } from 'react';
import { useSession } from 'next-auth/react';

type RsvpStatus = 'going' | 'maybe' | 'not-going';

interface RsvpData {
  status: RsvpStatus;
  notes?: string;
}

interface UseRsvpOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useRsvp(eventId: string, options: UseRsvpOptions = {}) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitRsvp = async (rsvpData: RsvpData) => {
    if (!session?.user) {
      throw new Error('You must be logged in to RSVP');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit RSVP');
      }

      const data = await response.json();
      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit RSVP');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitRsvp,
    isLoading,
    error,
  };
} 