import React, { useState } from 'react';
import { format } from 'date-fns';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  attendees: string[];
  interests: string[];
  host?: {
    name: string;
    email: string;
  };
  hostId?: string;
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
}

interface InvitationCardProps {
  invitation: Invitation;
  onAccept: (invitationId: string) => Promise<void>;
  onDecline: (invitationId: string) => Promise<void>;
}

export default function InvitationCard({ invitation, onAccept, onDecline }: InvitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onAccept(invitation._id);
    } catch (error) {
      setError('Failed to accept invitation');
      console.error('Error accepting invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onDecline(invitation._id);
    } catch (error) {
      setError('Failed to decline invitation');
      console.error('Error declining invitation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hostName = invitation.event.host?.name || 'Unknown Host';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-300';
      case 'declined':
        return 'bg-red-500/20 text-red-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="bg-[#1A1F39] rounded-xl p-6 space-y-4 border border-purple-800/30">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-white">{invitation.event.title}</h3>
          <p className="text-purple-300">Hosted by {hostName}</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-400 text-sm">
              Invited on {format(new Date(invitation.createdAt), 'MMM d, yyyy')}
            </p>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invitation.status)}`}>
              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
            </span>
          </div>
        </div>
        {invitation.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                       disabled:bg-purple-600/50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : 'Accept'}
            </button>
            <button
              onClick={handleDecline}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700
                       disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : 'Decline'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
        <svg
          className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-purple-800/30">
          <div className="space-y-2">
            <div className="flex items-center text-purple-300">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {format(new Date(invitation.event.date), 'MMMM d, yyyy h:mm a')}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {invitation.event.attendees.length} / {invitation.event.capacity} attendees
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Description</h4>
            <p className="text-gray-400">{invitation.event.description}</p>
          </div>

          {invitation.event.interests && invitation.event.interests.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {invitation.event.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm mt-2">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 