import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useSession } from 'next-auth/react';

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  interests?: string[];
}

interface InviteAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export default function InviteAttendeesModal({ isOpen, onClose, eventId }: InviteAttendeesModalProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && session) {
      fetchUsers();
      fetchExistingInvitations();
    }
  }, [isOpen, session, eventId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/users/search', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingInvitations = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/invitations`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }
      
      const data = await response.json();
      const invitedEmails = new Set(data.map((invitation: any) => invitation.invitedUser.email));
      
      // Update invitedUsers set based on email matches
      const invitedIds = new Set(
        users
          .filter(user => invitedEmails.has(user.email))
          .map(user => user._id)
      );
      setInvitedUsers(invitedIds);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleInvite = async (user: User) => {
    if (!session) {
      setError('Please sign in to invite users');
      return;
    }

    try {
      setInvitingUsers(prev => new Set(prev).add(user._id));
      setError('');

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId,
          invitedUser: {
            email: user.email,
            name: user.name
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }

      // Update both the local state and refetch invitations to ensure consistency
      setInvitedUsers(prev => new Set(prev).add(user._id));
      await fetchExistingInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInvitingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user._id);
        return newSet;
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0A0F29] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                  Invite Attendees
                </Dialog.Title>

                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1A1F39] text-white rounded-lg border border-purple-500/30 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {error && (
                  <div className="mt-2 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="text-center text-gray-400">No users found</p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3 hover:bg-[#1A1F39] rounded-lg mb-2"
                        >
                          <div>
                            <h4 className="font-medium text-white">{user.name}</h4>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.interests?.map((interest, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleInvite(user)}
                            disabled={invitingUsers.has(user._id) || invitedUsers.has(user._id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              invitedUsers.has(user._id)
                                ? 'bg-green-500/20 text-green-300 cursor-not-allowed'
                                : invitingUsers.has(user._id)
                                ? 'bg-purple-500/50 cursor-not-allowed'
                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }`}
                          >
                            {invitedUsers.has(user._id)
                              ? 'Invited'
                              : invitingUsers.has(user._id)
                              ? 'Inviting...'
                              : 'Invite'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 