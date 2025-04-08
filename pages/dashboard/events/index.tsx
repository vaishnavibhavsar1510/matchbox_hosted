import { useState } from 'react';
import { useEvents } from '../../../components/EventsContext';
import { useUser } from '../../../contexts/UserContext';
import { HamburgerButton } from '../../../components/HamburgerButton';
import { Sidebar } from '../../../components/Sidebar';
import { EventCard } from '../../../components/EventCard';
import { EventModal } from '../../../components/EventModal';
import { Event } from '../../../types/event';

export default function EventsPage() {
  const { events, loading, error } = useEvents();
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <HamburgerButton isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <div className="p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-purple-100 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6">
                      <div className="h-4 bg-purple-100 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-purple-100 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-purple-100 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <HamburgerButton isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
            <div className="p-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>Error loading events: {error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <HamburgerButton isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-purple-900 mb-8">Events</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  currentUser={user}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          currentUser={user}
        />
      )}
    </div>
  );
} 