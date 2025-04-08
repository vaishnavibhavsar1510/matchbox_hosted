import { appConfig } from '../config/app';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${appConfig.url}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || 'An error occurred', error);
  }

  return response.json();
}

export const api = {
  auth: {
    signIn: (data: { email: string; password: string }) =>
      fetchApi('/auth/signin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    signUp: (data: {
      email: string;
      password: string;
      name: string;
      age: number;
      gender: string;
      interests: string[];
    }) =>
      fetchApi('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  profile: {
    get: () => fetchApi('/profile'),
    update: (data: any) =>
      fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  matches: {
    get: () => fetchApi('/matches'),
    getPotential: () => fetchApi('/matches/potential'),
  },
  events: {
    get: () => fetchApi('/events'),
    create: (data: any) =>
      fetchApi('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
}; 