export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  interests?: string[];
  bio?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, additionalData?: Record<string, any>) => Promise<void>;
} 