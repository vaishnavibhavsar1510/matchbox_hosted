import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import InvitationCard from '../../../components/InvitationCard';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  attendees: string[];
  interests: string[];
  host: {
    name: string;
    email: string;
  };
}

interface Invitation {
  _id: string;
  eventId: string;
  event: Event;
  status: 'pending' | 'accepted' | 'declined';
  invitedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/invitations');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load invitations');
        }

        setInvitations(data);
      } catch (error) {
        console.error('Error loading invitations:', error);
        setError(error instanceof Error ? error.message : 'Failed to load invitations');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      loadInvitations();
    }
  }, [session]);

  const handleAccept = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }

      // Update the invitation status in the list
      setInvitations(prev => prev.map(inv => 
        inv._id === invitationId 
          ? { ...inv, status: 'accepted', updatedAt: new Date().toISOString() }
          : inv
      ));
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'declined' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to decline invitation');
      }

      // Update the invitation status in the list
      setInvitations(prev => prev.map(inv => 
        inv._id === invitationId 
          ? { ...inv, status: 'declined', updatedAt: new Date().toISOString() }
          : inv
      ));
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  };

  const filteredInvitations = invitations.filter(invitation => 
    activeTab === 'all' || invitation.status === activeTab
  );

  return (
    <div className="min-h-screen bg-[#0A0F29]">
      <Head>
        <title>Invitations | MatchBox</title>
        <meta name="description" content="View and manage your event invitations" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Invitations</h1>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'accepted'
                ? 'bg-green-500 text-white'
                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setActiveTab('declined')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'declined'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
            }`}
          >
            Declined
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="bg-purple-900/20 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Invitations</h3>
            <p className="text-purple-300">
              {activeTab === 'all'
                ? "You don't have any invitations at the moment."
                : `You don't have any ${activeTab} invitations.`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInvitations.map((invitation) => (
              <InvitationCard
                key={invitation._id}
                invitation={invitation}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 