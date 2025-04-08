import { useState } from 'react';
import { Event } from '../types/event';
import { User } from '../types/user';
import { useEvents } from './EventsContext';

interface EventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export function EventModal({ event, isOpen, onClose, currentUser }: EventModalProps) {
  const { updateRSVP } = useEvents();
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'going' | 'maybe' | 'not_going' | null>(
    currentUser ? event.rsvps?.[currentUser._id]?.status || null : null
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRSVP = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!currentUser) return;
    setSelectedStatus(status);
    await updateRSVP(event._id, status, notes);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden border border-purple-100">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-purple-900">{event.title}</h2>
            <button
              onClick={onClose}
              className="text-purple-500 hover:text-purple-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 mb-6">{event.description}</p>

          <div className="space-y-4 mb-6">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{event.location}</span>
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatDate(event.date)}</span>
            </div>
          </div>

          {currentUser && (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleRSVP('going')}
                  className={`flex-1 py-2 px-4 rounded ${
                    selectedStatus === 'going'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  Going
                </button>
                <button
                  onClick={() => handleRSVP('maybe')}
                  className={`flex-1 py-2 px-4 rounded ${
                    selectedStatus === 'maybe'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  Maybe
                </button>
                <button
                  onClick={() => handleRSVP('not_going')}
                  className={`flex-1 py-2 px-4 rounded ${
                    selectedStatus === 'not_going'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  Not Going
                </button>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Add any notes about your attendance..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 