import { User } from './user';

export interface Match {
  _id: string;
  userId: string;
  matchedUser: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt?: string;
  compatibilityScore?: number;
} 