export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  profileImage?: string;
  interests?: string[];
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
} 