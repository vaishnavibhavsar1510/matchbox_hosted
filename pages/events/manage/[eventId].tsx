import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  interests: string[];
  isPrivate: boolean;
  attendees: string[];
  rsvps: Record<string, { status: string; updatedAt: string }>;
  status: string;
  matchesRevealed: boolean;
  host: {
    name: string;
    email: string;
  };
}

interface User {
  email: string;
  name: string;
  interests?: string[];
}

export default function EventManagement() {
  const router = useRouter();
  const { data: session } = useSession();
  const { eventId } = router.query;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [potentialAttendees, setPotentialAttendees] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    if (eventId && session) {
      fetchEventDetails();
      fetchPotentialAttendees();
    }
  }, [eventId, session]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event details');
      const data = await response.json();
      setEvent(data);
    } catch (err) {
      setError('Error loading event details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPotentialAttendees = async () => {
    try {
      const response = await fetch('/api/users/potential-attendees');
      if (!response.ok) throw new Error('Failed to fetch potential attendees');
      const data = await response.json();
      setPotentialAttendees(data);
    } catch (err) {
      console.error('Error fetching potential attendees:', err);
    }
  };

  const handleInviteUsers = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmails: selectedUsers,
          message: inviteMessage
        })
      });

      if (!response.ok) throw new Error('Failed to send invitations');
      
      setInviteMessage('');
      setSelectedUsers([]);
      setInviteMessage('Invitations sent successfully!');
      
      // Refresh event details to show updated invites
      fetchEventDetails();
    } catch (err) {
      setError('Error sending invitations');
      console.error(err);
    }
  };

  const handleRevealMatches = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/reveal-matches`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to reveal matches');
      
      // Refresh event details
      fetchEventDetails();
    } catch (err) {
      setError('Error revealing matches');
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!event) return <div className="p-4">Event not found</div>;

  return (
    <div className="container mx-auto p-4">
      <Head>
        <title>Manage Event: {event.title}</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          <div className="space-y-2">
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Capacity:</strong> {event.attendees.length}/{event.capacity}</p>
            <p><strong>Status:</strong> {event.status}</p>
            <p><strong>Privacy:</strong> {event.isPrivate ? 'Private' : 'Public'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Invite Attendees</h2>
          <div className="space-y-4">
            <select
              multiple
              className="w-full border rounded p-2"
              value={selectedUsers}
              onChange={(e) => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))}
            >
              {potentialAttendees.map(user => (
                <option key={user.email} value={user.email}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            
            <textarea
              className="w-full border rounded p-2"
              placeholder="Add a personal message to your invitation..."
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />
            
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={handleInviteUsers}
              disabled={selectedUsers.length === 0}
            >
              Send Invitations
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Attendees</h2>
          <div className="space-y-2">
            {event.attendees.map(email => (
              <div key={email} className="flex items-center justify-between">
                <span>{email}</span>
                <span className="text-sm text-gray-500">
                  {event.rsvps[email]?.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Match Management</h2>
          <div className="space-y-4">
            <p>
              {event.matchesRevealed 
                ? "Matches have been revealed to attendees"
                : "Matches are currently hidden from attendees"}
            </p>
            
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={handleRevealMatches}
              disabled={event.matchesRevealed}
            >
              Reveal Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 