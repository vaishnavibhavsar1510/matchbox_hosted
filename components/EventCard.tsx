import { Event } from '../types/event';
import { User } from '../types/user';

interface EventCardProps {
  event: Event;
  currentUser: User | null;
  onClick: () => void;
}

export function EventCard({ event, currentUser, onClick }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRSVPStatus = () => {
    if (!currentUser) return null;
    const rsvp = event.rsvps?.[currentUser._id];
    if (!rsvp) return null;
    return rsvp.status;
  };

  const rsvpStatus = getRSVPStatus();
  const rsvpCount = Object.values(event.rsvps || {}).filter(
    (rsvp) => rsvp.status === 'going'
  ).length;

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 border border-purple-100"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-purple-900">{event.title}</h3>
          {rsvpStatus && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                rsvpStatus === 'going'
                  ? 'bg-purple-100 text-purple-800'
                  : rsvpStatus === 'maybe'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {rsvpStatus.charAt(0).toUpperCase() + rsvpStatus.slice(1)}
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-4">{event.description}</p>
        <div className="space-y-2">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{rsvpCount} going</span>
          </div>
        </div>
      </div>
    </div>
  );
} 