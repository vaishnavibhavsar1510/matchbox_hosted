import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSession } from 'next-auth/react';

export default function UserType() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [selectedType, setSelectedType] = useState<'host' | 'attendee' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selectedType) {
      setError('Please select a user type to continue');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userType: selectedType }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user type');
      }

      // Proceed to preferences page
      router.push('/onboarding/preferences');
    } catch (err) {
      setError('Failed to save your selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F29] flex flex-col">
      <Head>
        <title>Choose Your Role | MatchBox</title>
        <meta name="description" content="Select your role in MatchBox" />
      </Head>

      <div className="flex flex-col items-center justify-center px-4 py-10 flex-grow">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Choose Your Role</h1>
            <p className="text-purple-300">Select how you want to participate in MatchBox events</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Host Option */}
            <button
              onClick={() => setSelectedType('host')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedType === 'host'
                  ? 'border-purple-500 bg-purple-900/30'
                  : 'border-purple-800/30 hover:border-purple-700/50 bg-purple-900/10'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                  </svg>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedType === 'host' ? 'border-purple-500 bg-purple-500' : 'border-purple-800'
                }`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Event Host</h3>
              <p className="text-purple-300">Create and manage events, invite attendees, and facilitate matches</p>
            </button>

            {/* Attendee Option */}
            <button
              onClick={() => setSelectedType('attendee')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedType === 'attendee'
                  ? 'border-purple-500 bg-purple-900/30'
                  : 'border-purple-800/30 hover:border-purple-700/50 bg-purple-900/10'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedType === 'attendee' ? 'border-purple-500 bg-purple-500' : 'border-purple-800'
                }`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Event Attendee</h3>
              <p className="text-purple-300">Join events, meet new people, and find your best matches</p>
            </button>
          </div>

          {error && (
            <div className="mt-6 text-red-400 text-center">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!selectedType || isLoading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold 
                       disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 
                       transition-all duration-300 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 