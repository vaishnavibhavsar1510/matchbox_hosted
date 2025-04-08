import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import InviteAttendeesModal from '../../../components/InviteAttendeesModal';
import { format } from 'date-fns';
import { CalendarIcon, MapPinIcon, UsersIcon, UserIcon } from '@heroicons/react/24/outline';

interface Attendee {
  email: string;
  name: string;
  joinedAt: string;
}

interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
  capacity: number;
  attendees: Attendee[];
  status: 'upcoming' | 'ongoing' | 'completed';
  matchesRevealed: boolean;
  host: {
    name: string;
    email: string;
  };
  rsvps: {
    [key: string]: {
      status: 'going' | 'maybe' | 'not_going';
      notes?: string;
      updatedAt: string;
    };
  };
}

interface Invitation {
  _id: string;
  eventId: string;
  event: Event;
  status: 'pending' | 'accepted' | 'declined';
  invitedUser: {
    email: string;
    name: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export default function HostDashboard() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activeTab, setActiveTab] = useState<'hosting' | 'attending'>('hosting');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch hosted events
        const eventsResponse = await fetch('/api/events/hosted');
        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch hosted events');
        }
        const eventsData = await eventsResponse.json();
        setHostedEvents(eventsData);

        // Log the events data for debugging
        console.log('Hosted events:', eventsData);

        // Fetch attending events
        const attendingResponse = await fetch('/api/events/attending');
        if (!attendingResponse.ok) {
          throw new Error('Failed to fetch attending events');
        }
        const attendingData = await attendingResponse.json();
        setAttendingEvents(attendingData);

        // Fetch invitations
        const invitationsResponse = await fetch('/api/invitations');
        if (!invitationsResponse.ok) {
          throw new Error('Failed to fetch invitations');
        }
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData);

      } catch (error) {
        console.error('Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      loadData();
    }
  }, [session, activeTab]);

  const handleInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: accept ? 'accepted' : 'declined',
        }),
      });

      if (response.ok) {
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
        if (accept) {
          const invitation = invitations.find(inv => inv._id === invitationId);
          if (invitation) {
            setAttendingEvents(prev => [...prev, invitation.event]);
          }
        }
      }
    } catch (error) {
      console.error('Error handling invitation:', error);
    }
  };

  const handleRevealMatches = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/reveal-matches`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update the local state to reflect the matches being revealed
        setHostedEvents(prev =>
          prev.map(event =>
            event._id === eventId
              ? { ...event, matchesRevealed: true }
              : event
          )
        );
      }
    } catch (error) {
      console.error('Error revealing matches:', error);
    }
  };

  const handleInviteClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsInviteModalOpen(true);
  };

  const getRsvpCounts = (event: Event) => {
    const rsvps = event.rsvps || {};
    return {
      going: Object.values(rsvps).filter(r => r.status === 'going').length,
      maybe: Object.values(rsvps).filter(r => r.status === 'maybe').length,
      notGoing: Object.values(rsvps).filter(r => r.status === 'not_going').length,
    };
  };

  const updateEventAttendees = (eventId: string, updatedEvent: any) => {
    setHostedEvents(prev => 
      prev.map(event => 
        event._id === eventId 
          ? { ...event, attendees: updatedEvent.attendees }
          : event
      )
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-red-500/20"></div>
          </div>
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Error Loading Dashboard</h2>
          <p className="text-red-300/70">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F29]">
      <Head>
        <title>Host Dashboard | MatchBox</title>
        <meta name="description" content="Manage your MatchBox events" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/host/profile"
              className="px-6 py-3 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 rounded-lg
                       hover:from-purple-600/30 hover:to-indigo-600/30 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
            <Link
              href="/events/create"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg
                       hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
            >
              Create New Event
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex space-x-4 border-b border-purple-800/30">
            <button
              onClick={() => setActiveTab('hosting')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'hosting'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-purple-300'
              }`}
            >
              Hosting
            </button>
            <button
              onClick={() => setActiveTab('attending')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'attending'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-purple-300'
              }`}
            >
              Attending
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'hosting' ? (
              <section>
                {hostedEvents.length === 0 ? (
                  <div className="bg-purple-900/20 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Events Created Yet</h3>
                    <p className="text-purple-300">Start by creating your first event!</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {hostedEvents.map((event) => {
                      const rsvpCounts = getRsvpCounts(event);
                      return (
                        <div
                          key={event._id}
                          className="bg-[#1A1F39] rounded-xl p-6 space-y-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center text-gray-400">
                                  <CalendarIcon className="w-5 h-5 mr-2" />
                                  {format(new Date(event.date), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center text-gray-400">
                                  <MapPinIcon className="w-5 h-5 mr-2" />
                                  {event.location}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-purple-300">
                              <UsersIcon className="w-5 h-5 mr-2" />
                              <span>
                                {event.attendees?.length || 0} / {event.capacity} attendees
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleInviteClick(event._id)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                Invite Attendees
                              </button>
                              <button
                                onClick={() => handleRevealMatches(event._id)}
                                disabled={event.matchesRevealed || (event.attendees?.length || 0) < 2}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  event.matchesRevealed
                                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                    : (event.attendees?.length || 0) < 2
                                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                {event.matchesRevealed ? 'Matches Revealed' : 'Reveal Matches'}
                              </button>
                            </div>
                          </div>

                          {event.attendees && event.attendees.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-white font-medium mb-2">Attendees</h4>
                              <div className="space-y-2">
                                {event.attendees.map((attendee: any) => (
                                  <div key={attendee.email} className="flex items-center justify-between text-gray-400">
                                    <div className="flex items-center">
                                      <UserIcon className="w-4 h-4 mr-2" />
                                      <span>{attendee.name}</span>
                                    </div>
                                    <span className="text-sm">
                                      Joined {attendee.joinedAt ? format(new Date(attendee.joinedAt), 'MMM d, yyyy') : 'Recently'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : (
              <div className="space-y-8">
                {/* Pending Invitations */}
                {invitations.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-white mb-4">Pending Invitations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation._id}
                          className="bg-purple-900/20 rounded-xl p-6 border border-purple-800/30"
                        >
                          <h3 className="text-lg font-semibold text-white mb-2">{invitation.event.title}</h3>
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center text-purple-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(invitation.event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-purple-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {invitation.event.location}
                            </div>
                            <div className="flex items-center text-purple-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Invited by {invitation.invitedBy.name}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInvitation(invitation._id, true)}
                              className="flex-1 px-4 py-2 bg-green-600/20 text-green-300 rounded-lg
                                       hover:bg-green-600/40 transition-all duration-300"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleInvitation(invitation._id, false)}
                              className="flex-1 px-4 py-2 bg-red-600/20 text-red-300 rounded-lg
                                       hover:bg-red-600/40 transition-all duration-300"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Events Attending */}
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">Events You're Attending</h2>
                  {attendingEvents.length === 0 ? (
                    <div className="bg-purple-900/20 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
                      <p className="text-purple-300">You haven't joined any events yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {attendingEvents.map((event) => (
                        <div
                          key={event._id}
                          className="bg-purple-900/20 rounded-xl p-6 border border-purple-800/30"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                              event.status === 'ongoing' ? 'bg-green-500/20 text-green-300' :
                              'bg-purple-500/20 text-purple-300'
                            }`}>
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </span>
                          </div>
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center text-purple-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-purple-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </div>
                            <div className="flex items-center text-purple-300">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Hosted by {event.host.name}
                            </div>
                          </div>
                          <Link
                            href={`/events/${event._id}`}
                            className="w-full px-4 py-2 bg-purple-900/40 text-purple-300 rounded-lg text-center block
                                     hover:bg-purple-900/60 transition-all duration-300"
                          >
                            View Details
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedEventId && (
        <InviteAttendeesModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false);
            setSelectedEventId(null);
          }}
          eventId={selectedEventId}
        />
      )}
    </div>
  );
} 