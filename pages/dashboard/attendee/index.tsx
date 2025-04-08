import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useUser } from '../../../components/UserContext';
import { DigitalWingmate } from '../../../components/DigitalWingmate';
import { RsvpModal } from '../../../components/RsvpModal';
import { Sidebar } from '../../../components/Sidebar';
import { HamburgerButton } from '../../../components/HamburgerButton';
import { useEvents } from '../../../components/EventsContext';
import { Chat } from '../../../components/Chat';
import { Event } from '../../../types/event';
import Head from 'next/head';

interface Match {
  _id: string;
  name: string;
  email: string;
  interests: string[];
  profileImage?: string;
  compatibilityScore?: number;
  bio?: string;
}

type RsvpStatus = 'going' | 'maybe' | 'not_going';

function EventCard({ event, onRsvp }: { event: Event; onRsvp: (event: Event) => void }) {
  const { userData } = useUser();
  const { data: session } = useSession();

  const userRsvp = event.rsvps?.[session?.user?.email || '']?.status;

  const getButtonStyle = (status: string | undefined) => {
    switch (status) {
      case 'going':
        return 'bg-green-600 text-white';
      case 'maybe':
        return 'bg-yellow-600 text-white';
      case 'not_going':
        return 'bg-red-600 text-white';
      default:
        return 'bg-purple-900/50 text-purple-200 hover:bg-purple-900/70';
    }
  };

  const getButtonText = (status: string | undefined) => {
    switch (status) {
      case 'going':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'not_going':
        return 'Not Going';
      default:
        return 'RSVP';
    }
  };

  return (
    <div className="bg-[#2A2640] rounded-lg p-4 border border-purple-900/20 hover:border-purple-600/40 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{event.title}</h3>
          <p className="text-purple-200/70 text-sm line-clamp-2">{event.description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-purple-200">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(event.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-purple-200">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{event.location}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-purple-200/70">
          <span>{Object.values(event.rsvps || {}).filter(rsvp => rsvp.status === 'going').length} attending</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onRsvp(event)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${getButtonStyle(userRsvp)}`}
          >
            {getButtonText(userRsvp)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });
  const { events, loading: eventsLoading, error: eventsError, updateRSVP } = useEvents();
  const { userData, isLoading: userLoading } = useUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<Match | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (userData && !userData.interests?.length && status === 'authenticated') {
      router.push('/onboarding/preferences');
    }
  }, [userData, router, status]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (status !== 'authenticated' || !session?.user?.email) return;
      
      try {
        const response = await fetch(`/api/matches?email=${session.user.email}`);
        if (response.ok) {
          const data = await response.json();
          setMatches(data);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };

    if (status === 'authenticated') {
      fetchMatches();
    }
  }, [session?.user?.email, status]);

  if (status === 'loading' || userLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-semibold text-purple-200 mb-4">Loading...</h2>
          <p className="text-purple-200/70">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !session) {
    return null;
  }

  const handleRsvp = (event: Event) => {
    setSelectedEvent(event);
    setIsRsvpModalOpen(true);
  };

  const handleRsvpConfirm = async (details: { status: RsvpStatus; notes?: string }) => {
    if (!selectedEvent?._id || !session?.user?.email) return;

    try {
      await updateRSVP(selectedEvent._id, details.status, details.notes);
      setIsRsvpModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const handleStartChat = (match: Match) => {
    setActiveChat(match);
  };

  return (
    <div className="min-h-screen bg-[#0A0F29]">
      <Head>
        <title>Dashboard - MatchBox</title>
        <meta name="description" content="Your MatchBox dashboard" />
      </Head>

      <HamburgerButton 
        isOpen={isSidebarOpen} 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex-1">
        <header className="bg-[#1E1B2E] shadow-lg border-b border-purple-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-8">
              <div className="ml-16">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                  MatchBox
                </h1>
                <p className="text-purple-200/90 mt-1">
                  Welcome back, {userData?.name || 'there'}! 👋
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="px-4 py-2 text-purple-300 hover:text-purple-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/auth/login')}
                  className="px-4 py-2 text-purple-300 hover:text-purple-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Best Match and Digital Wingmate */}
            <div className="lg:col-span-2 space-y-8">
              {/* Best Match Section */}
              <div className="bg-[#1E1B2E] rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-white mb-6">Your Best Match</h2>
                {matches.length > 0 ? (
                  <div className="p-6 bg-gradient-to-br from-purple-900/20 via-violet-800/15 to-indigo-900/20 rounded-2xl backdrop-blur-sm border border-purple-800/20">
                    <div className="flex items-center gap-6">
                      {/* Left side - Profile Image */}
                      <div className="flex-shrink-0">
                        {matches[0].profileImage ? (
                          <img
                            src={matches[0].profileImage}
                            alt={matches[0].name}
                            className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-purple-500/30 ring-offset-2 ring-offset-[#1E1B2E]"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-center text-white text-2xl font-medium shadow-lg ring-2 ring-purple-500/30 ring-offset-2 ring-offset-[#1E1B2E]">
                            {matches[0].name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Right side - Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-1">{matches[0].name}</h3>
                            <span className="inline-flex items-center px-3 py-1 bg-purple-900/30 text-purple-200 rounded-full text-sm font-medium backdrop-blur-sm border border-purple-700/30">
                              {Math.round(matches[0].compatibilityScore || 0)}% Match
                            </span>
                          </div>
                        </div>

                        {matches[0].interests && matches[0].interests.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-purple-200 mb-2">Shared Interests</h4>
                            <div className="flex flex-wrap gap-2">
                              {matches[0].interests.map((interest, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-purple-900/20 text-purple-200 rounded-full text-sm backdrop-blur-sm border border-purple-800/20"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {matches[0].bio && (
                          <p className="text-purple-200/90 mb-4 line-clamp-2 text-sm">{matches[0].bio}</p>
                        )}

                        <button
                          onClick={() => handleStartChat(matches[0])}
                          className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 text-white rounded-lg hover:shadow-lg hover:shadow-purple-900/30 transition-all duration-300 font-medium tracking-wide flex items-center justify-center gap-2 group"
                        >
                          <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Start Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-purple-900/20 via-violet-800/15 to-indigo-900/20 rounded-2xl backdrop-blur-sm border border-purple-800/20">
                    <div className="w-20 h-20 rounded-full bg-purple-900/30 flex items-center justify-center ring-2 ring-purple-500/30 ring-offset-2 ring-offset-[#1E1B2E]">
                      <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">No Matches Yet</h3>
                      <p className="text-purple-200/90 text-sm">
                        Complete your profile to find better matches! Add your interests and preferences to get started.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Digital Wingmate Section */}
              <div className="bg-[#1E1B2E] rounded-lg shadow-lg p-6 border border-purple-900/20">
                <h2 className="text-2xl font-semibold text-white mb-4">Digital Wingmate</h2>
                <DigitalWingmate />
              </div>
            </div>

            {/* Right Column - Events */}
            <div className="space-y-8">
              {/* Events Section */}
              <div className="bg-[#1E1B2E] rounded-lg shadow-lg p-6 border border-purple-900/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-white">Upcoming Events</h2>
                </div>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                  </div>
                ) : eventsError ? (
                  <div className="text-center py-8 text-red-400">
                    <p>{eventsError}</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-purple-200/70">
                    <p>No upcoming events at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <EventCard key={event._id} event={event} onRsvp={handleRsvp} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Section */}
          {activeChat && (
            <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#1E1B2E] shadow-lg rounded-t-lg border border-purple-900/30">
              <Chat recipient={activeChat} onClose={() => setActiveChat(null)} />
            </div>
          )}

          {/* RSVP Modal */}
          {isRsvpModalOpen && selectedEvent && (
            <RsvpModal
              event={selectedEvent}
              onClose={() => {
                setIsRsvpModalOpen(false);
                setSelectedEvent(null);
              }}
              onConfirm={handleRsvpConfirm}
              currentStatus={selectedEvent.rsvps?.[session?.user?.email || '']?.status}
            />
          )}
        </main>
      </div>
    </div>
  );
} 