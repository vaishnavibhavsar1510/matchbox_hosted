import { useState } from 'react';
import { useUser } from '../../../components/UserContext';
import { HamburgerButton } from '../../../components/HamburgerButton';
import { Sidebar } from '../../../components/Sidebar';
import { useMatches } from '../../../components/MatchesContext';
import { Match } from '../../../types/match';
import { useRouter } from 'next/router';

export default function MatchesPage() {
  const { userData } = useUser();
  const { matches, loading, error, updateMatchStatus } = useMatches();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const router = useRouter();

  const filteredMatches = matches?.filter((match: Match) => {
    if (selectedFilter === 'all') return true;
    return match.status === selectedFilter;
  });

  const handleAcceptMatch = async (matchId: string) => {
    try {
      await updateMatchStatus(matchId, 'accepted');
    } catch (err) {
      console.error('Failed to accept match:', err);
    }
  };

  const handleDeclineMatch = async (matchId: string) => {
    try {
      await updateMatchStatus(matchId, 'declined');
    } catch (err) {
      console.error('Failed to decline match:', err);
    }
  };

  const handleStartChat = async (userId: string) => {
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
      console.error('Failed to start chat:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <HamburgerButton isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <div className="p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-purple-100 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6">
                      <div className="h-4 bg-purple-100 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-purple-100 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-purple-100 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <HamburgerButton isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <div className="p-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>Error loading matches: {error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <HamburgerButton isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-purple-900">Matches</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-4 py-2 rounded-full ${
                    selectedFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter('pending')}
                  className={`px-4 py-2 rounded-full ${
                    selectedFilter === 'pending'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setSelectedFilter('accepted')}
                  className={`px-4 py-2 rounded-full ${
                    selectedFilter === 'accepted'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  Accepted
                </button>
                <button
                  onClick={() => setSelectedFilter('declined')}
                  className={`px-4 py-2 rounded-full ${
                    selectedFilter === 'declined'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  Declined
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches?.map((match: Match) => (
                <div
                  key={match._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border border-purple-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <img
                        src={match.matchedUser.image || '/default-avatar.png'}
                        alt={match.matchedUser.name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-purple-900">
                          {match.matchedUser.name}
                        </h3>
                        <p className="text-gray-600">{match.matchedUser.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-purple-700">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Matched on {new Date(match.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center text-purple-700">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span className={`capitalize ${
                          match.status === 'accepted'
                            ? 'text-green-600'
                            : match.status === 'declined'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>

                    {match.status === 'pending' && (
                      <div className="mt-4 flex space-x-4">
                        <button
                          onClick={() => handleAcceptMatch(match._id)}
                          className="flex-1 bg-purple-100 text-purple-800 hover:bg-purple-200 py-2 px-4 rounded"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineMatch(match._id)}
                          className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 py-2 px-4 rounded"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {match.status === 'accepted' && (
                      <button
                        onClick={() => handleStartChat(match.matchedUser._id)}
                        className="mt-4 w-full bg-purple-600 text-white hover:bg-purple-700 py-2 px-4 rounded"
                      >
                        Start Chat
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 