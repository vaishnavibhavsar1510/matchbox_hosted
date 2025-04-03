import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface FormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: string;
  interests: string[];
  isPrivate: boolean;
}

const INTEREST_OPTIONS = [
  'Art & Culture',
  'Sports & Fitness',
  'Technology',
  'Music',
  'Food & Cooking',
  'Travel & Adventure',
  'Books & Literature',
  'Gaming',
  'Movies & TV',
  'Business & Career',
  'Education',
  'Fashion',
  'Health & Wellness',
  'Pets & Animals',
  'Science',
  'Social Causes'
];

export default function CreateEvent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
    interests: [],
    isPrivate: false
  });

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  if (!session) {
    return <div className="p-4 text-red-500">Please sign in to create an event.</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          datetime: new Date(`${formData.date}T${formData.time}`).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      router.push(`/events/manage/${data.eventId}`);
    } catch (error: any) {
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F29] py-12">
      <Head>
        <title>Create New Event - MatchBox</title>
        <meta name="description" content="Create a new event on MatchBox" />
      </Head>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1E1B2E] rounded-xl shadow-xl p-8 border border-purple-900/20">
          <h1 className="text-3xl font-bold text-white mb-8">Create New Event</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-1">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-purple-900/20 border border-purple-800/30 rounded-lg text-white
                         focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 bg-purple-900/20 border border-purple-800/30 rounded-lg text-white
                         focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Describe your event"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-purple-900/20 border border-purple-800/30 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-purple-900/20 border border-purple-800/30 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-purple-900/20 border border-purple-800/30 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Enter event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  min="2"
                  max="100"
                  className="w-full px-4 py-2 bg-purple-900/20 border border-purple-800/30 rounded-lg text-white
                           focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">
                Event Interests (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                              ${formData.interests.includes(interest)
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-900/20 text-purple-300 hover:bg-purple-900/40'
                              }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="h-4 w-4 rounded border-purple-800/30 text-purple-600 focus:ring-purple-600
                         bg-purple-900/20"
              />
              <label htmlFor="isPrivate" className="ml-2 block text-sm text-purple-300">
                Make this event private (invitation only)
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-purple-900/40 text-purple-300 rounded-lg hover:bg-purple-900/60
                         transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg
                          hover:from-purple-700 hover:to-indigo-700 transition-all duration-300
                          ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 