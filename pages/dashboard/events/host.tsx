import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../components/AuthContext';
import { Sidebar } from '../../../components/Sidebar';
import { useSession } from 'next-auth/react';

interface EventFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  maxParticipants: number;
  interests: string[];
}

export default function HostEvent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { data: session } = useSession();
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    maxParticipants: 10,
    interests: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-semibold text-purple-200 mb-4">Loading...</h2>
          <p className="text-purple-200/70">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formattedDate = new Date(`${formData.date}T${formData.time}`).toISOString();
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          datetime: formattedDate,
          location: formData.location,
          capacity: formData.maxParticipants,
          interests: formData.interests,
          isPrivate: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      const { event } = await response.json();
      router.push('/dashboard/host');
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interest = e.target.value;
    setFormData(prev => ({
      ...prev,
      interests: e.target.checked
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };

  return (
    <div className="flex h-screen bg-[#0A0F29]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-purple-200">Host an Event</h1>
            <p className="mt-2 text-purple-300/70">Create a new event to connect with others</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-[#1E1B2E] shadow rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-purple-200">
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  className="mt-1 block w-full rounded-md border-purple-900/20 bg-[#0A0F29] text-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-purple-200">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    required
                    className="mt-1 block w-full rounded-md border-purple-900/20 bg-[#0A0F29] text-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-purple-200">
                    Time
                  </label>
                  <input
                    type="time"
                    id="time"
                    required
                    className="mt-1 block w-full rounded-md border-purple-900/20 bg-[#0A0F29] text-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-purple-200">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  required
                  className="mt-1 block w-full rounded-md border-purple-900/20 bg-[#0A0F29] text-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-purple-200">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  required
                  className="mt-1 block w-full rounded-md border-purple-900/20 bg-[#0A0F29] text-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-purple-200">
                  Maximum Participants
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  min="2"
                  required
                  className="mt-1 block w-full rounded-md border-purple-900/20 bg-[#0A0F29] text-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Interests
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Photography', 'Hiking', 'Coffee', 'Art', 'Music', 'Sports', 'Travel', 'Cooking'].map((interest) => (
                    <label key={interest} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={interest}
                        checked={formData.interests.includes(interest)}
                        onChange={handleInterestChange}
                        className="rounded border-purple-900/20 bg-[#0A0F29] text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-purple-200">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-purple-200 bg-[#0A0F29] border border-purple-900/20 rounded-md hover:bg-purple-900/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 