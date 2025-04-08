import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Event } from '@/types/event';

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status, router]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string, status: 'going' | 'maybe' | 'not-going') => {
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update RSVP');
      }

      // Refresh events to get updated RSVP status
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Events</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event._id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Date: {new Date(event.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">Location: {event.location}</p>
              <p className="text-sm text-gray-500">Max Attendees: {event.maxAttendees}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRSVP(event._id, 'going')}
                className={`px-4 py-2 rounded ${
                  event.rsvps[session?.user?.email || '']?.status === 'going'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Going
              </button>
              <button
                onClick={() => handleRSVP(event._id, 'maybe')}
                className={`px-4 py-2 rounded ${
                  event.rsvps[session?.user?.email || '']?.status === 'maybe'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Maybe
              </button>
              <button
                onClick={() => handleRSVP(event._id, 'not-going')}
                className={`px-4 py-2 rounded ${
                  event.rsvps[session?.user?.email || '']?.status === 'not-going'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Not Going
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 