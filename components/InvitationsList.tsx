import React from 'react';
import { useEffect, useState } from 'react';

interface Invitation {
  _id: string;
  event: {
    _id: string;
    title: string;
    date: string;
    location: string;
  };
  invitedBy: {
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'declined';
}

export default function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId: string, accept: boolean) => {
    setResponding(prev => ({ ...prev, [invitationId]: true }));
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
        // Remove the invitation from the list
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    } finally {
      setResponding(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Event Invitations</h2>
      
      {invitations.length === 0 ? (
        <div className="bg-[#1A1F39] rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Invitations</h3>
          <p className="text-gray-400">You don't have any pending invitations at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {invitations.map((invitation) => (
            <div
              key={invitation._id}
              className="bg-[#1A1F39] rounded-xl p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {invitation.event.title}
                  </h3>
                  <div className="space-y-2 text-gray-400">
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(invitation.event.date).toLocaleDateString()}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {invitation.event.location}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Invited by {invitation.invitedBy.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => handleResponse(invitation._id, true)}
                  disabled={responding[invitation._id]}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    responding[invitation._id]
                      ? 'bg-green-500/50 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white transition-colors duration-200`}
                >
                  {responding[invitation._id] ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleResponse(invitation._id, false)}
                  disabled={responding[invitation._id]}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    responding[invitation._id]
                      ? 'bg-red-500/50 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white transition-colors duration-200`}
                >
                  {responding[invitation._id] ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 