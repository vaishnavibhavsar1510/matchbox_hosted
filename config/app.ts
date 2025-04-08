import { env } from '../utils/env';

export const appConfig = {
  name: 'MatchBox',
  description: 'Find your perfect match with AI-powered matching',
  url: env.appUrl,
  environment: env.nodeEnv,
  isDevelopment: env.nodeEnv === 'development',
  isProduction: env.nodeEnv === 'production',
  api: {
    openai: {
      apiKey: env.openaiApiKey,
    },
  },
  auth: {
    signInUrl: '/auth/signin',
    signUpUrl: '/auth/signup',
    dashboardUrl: '/dashboard',
    profileUrl: '/dashboard/profile',
  },
  features: {
    aiMatching: true,
    profileVerification: true,
    eventPlanning: true,
  },
} as const; 