import React, { useState } from 'react';
import { Event } from '@/types/event';

interface RsvpModalProps {
  event: Event;
  onClose: () => void;
  onConfirm: (details: { status: 'going' | 'maybe' | 'not_going'; notes?: string }) => void;
  currentStatus?: 'going' | 'maybe' | 'not_going';
}

export function RsvpModal({ event, onClose, onConfirm, currentStatus }: RsvpModalProps) {
  const [status, setStatus] = useState<'going' | 'maybe' | 'not_going'>(currentStatus || 'going');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ status, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1E1B2E] w-full max-w-md rounded-2xl shadow-lg border border-purple-800/30">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">RSVP to Event</h3>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-purple-200 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-medium text-white mb-2">{event.title}</h4>
            <p className="text-purple-200/90 text-sm">{event.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-purple-200">
                Will you attend?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('going')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    status === 'going'
                      ? 'bg-green-900/30 text-green-300 border border-green-700/30'
                      : 'bg-purple-900/20 text-purple-200 border border-purple-800/20 hover:bg-purple-900/30'
                  }`}
                >
                  Going
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('maybe')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    status === 'maybe'
                      ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/30'
                      : 'bg-purple-900/20 text-purple-200 border border-purple-800/20 hover:bg-purple-900/30'
                  }`}
                >
                  Maybe
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('not_going')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    status === 'not_going'
                      ? 'bg-red-900/30 text-red-300 border border-red-700/30'
                      : 'bg-purple-900/20 text-purple-200 border border-purple-800/20 hover:bg-purple-900/30'
                  }`}
                >
                  Not Going
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-purple-200 mb-2">
                Add a note (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
                placeholder="Any comments or notes..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-purple-900/30 text-purple-200 rounded-lg hover:bg-purple-900/40 transition-all duration-300 text-sm font-medium border border-purple-800/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 text-white rounded-lg hover:shadow-lg hover:shadow-purple-900/30 transition-all duration-300 text-sm font-medium"
              >
                Confirm RSVP
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 