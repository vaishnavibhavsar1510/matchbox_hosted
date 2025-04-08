export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  hostId: string;
  createdAt: string;
  updatedAt: string;
  rsvps?: {
    [userId: string]: {
      status: 'going' | 'maybe' | 'not_going';
      notes?: string;
      updatedAt: string;
    };
  };
} 