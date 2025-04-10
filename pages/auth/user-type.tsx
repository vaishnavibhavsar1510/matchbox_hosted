import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function UserType() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const handleUserTypeSelection = async (userType: 'host' | 'attendee') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/update-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session?.user?.email,
          userType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user type');
      }

      // Redirect to preferences page after setting user type
      router.push('/preferences');
    } catch (err) {
      setError('Failed to update user type. Please try again.');
      console.error('Error updating user type:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your Role
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select how you want to use Matchbox
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={() => handleUserTypeSelection('host')}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            I want to host events
          </button>

          <button
            onClick={() => handleUserTypeSelection('attendee')}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            I want to attend events
          </button>
        </div>
      </div>
    </div>
  );
} 